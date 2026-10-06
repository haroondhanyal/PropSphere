import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Injectable, Module, NotFoundException, Param, Post, RawBodyRequest, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { InvoiceStatus, PaymentCheckoutStatus, PaymentMethod } from '@prisma/client'
import { IsNumber, IsOptional, Min } from 'class-validator'
import { Type } from 'class-transformer'
import type { Request } from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'
import Safepay from '@sfpy/node-core'
import { PrismaService } from './prisma.service'
import { AuthGuard, AuthUser, CurrentUser } from './access'
import { AuthModule } from './auth.module'

class CheckoutDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) amount?: number
}

type SafepayEvent = {
  token?: string
  type?: string
  data?: { tracker?: string; amount?: number; currency?: string }
}

@Injectable()
class PaymentsService {
  constructor(private db: PrismaService) {}

  private get config() {
    const secret = process.env.SAFEPAY_SECRET_KEY
    const publicKey = process.env.SAFEPAY_API_KEY
    if (!secret || !publicKey) throw new ServiceUnavailableException('Online checkout is not configured')
    const production = process.env.SAFEPAY_ENV === 'production'
    return {
      publicKey,
      production,
      client: new Safepay(secret, { authType: 'secret', host: production ? 'https://api.getsafepay.com' : 'https://sandbox.api.getsafepay.com' }),
    }
  }

  async createCheckout(invoiceId: string, requestedAmount: number | undefined, user: AuthUser) {
    const invoice = await this.db.rentInvoice.findFirst({
      where: { id: invoiceId, lease: { tenantId: user.sub }, status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] } },
      include: { lease: { include: { property: true } } },
    })
    if (!invoice) throw new NotFoundException('Open invoice not found for your account')
    const remaining = Number(invoice.amount) - Number(invoice.amountPaid)
    const amount = requestedAmount ?? remaining
    if (!Number.isFinite(amount) || amount < 1 || amount > remaining) throw new BadRequestException('Enter a payment amount within the outstanding balance')
    const amountMinor = Math.round(amount * 100)
    if (Math.abs(amountMinor / 100 - amount) > 0.000001) throw new BadRequestException('Payments can use up to two decimal places')

    const previous = await this.db.paymentCheckout.findFirst({ where: { invoiceId, payerId: user.sub, status: PaymentCheckoutStatus.PENDING }, orderBy: { createdAt: 'desc' } })
    if (previous && Date.now() - previous.createdAt.getTime() < 45 * 60 * 1000) return { checkoutUrl: previous.checkoutUrl, tracker: previous.tracker, amount: Number(previous.amount), currency: previous.currency }
    if (previous) await this.db.paymentCheckout.updateMany({ where: { id: previous.id, status: PaymentCheckoutStatus.PENDING }, data: { status: PaymentCheckoutStatus.FAILED } })

    const { client, publicKey, production } = this.config
    const session = await client.payments.session.setup({
      merchant_api_key: publicKey,
      intent: 'CYBERSOURCE',
      mode: 'payment',
      entry_mode: 'raw',
      currency: 'PKR',
      amount: amountMinor,
      metadata: { invoice_id: invoice.id, payer_id: user.sub },
      include_fees: false,
    })
    const tracker = session?.data?.tracker?.token
    if (!tracker) throw new ServiceUnavailableException('Payment provider did not return a checkout tracker')
    const auth = await client.client.passport.create()
    const tbt = auth?.data
    if (typeof tbt !== 'string' || !tbt) throw new ServiceUnavailableException('Payment provider did not return a checkout token')
    const webUrl = process.env.WEB_URL || 'http://127.0.0.1:5173'
    const checkoutUrl = client.checkout.createCheckoutUrl({
      env: production ? 'production' : 'sandbox',
      tracker,
      tbt,
      source: 'hosted',
      order_id: invoice.id,
      redirect_url: `${webUrl}/workspace/rent?checkout=return`,
      cancel_url: `${webUrl}/workspace/rent?checkout=cancelled`,
    })
    await this.db.paymentCheckout.create({
      data: { invoiceId, payerId: user.sub, tracker, checkoutUrl, amount, currency: 'PKR' },
    })
    return { checkoutUrl, tracker, amount, currency: 'PKR' }
  }

  async cancelCheckout(tracker: string, user: AuthUser) {
    const result = await this.db.paymentCheckout.updateMany({ where: { tracker, payerId: user.sub, status: PaymentCheckoutStatus.PENDING }, data: { status: PaymentCheckoutStatus.CANCELLED } })
    if (!result.count) throw new NotFoundException('Pending checkout not found')
    return { cancelled: true }
  }

  async checkoutStatus(tracker: string, user: AuthUser) {
    const checkout = await this.db.paymentCheckout.findFirst({ where: { tracker, payerId: user.sub }, select: { status: true, amount: true, currency: true, completedAt: true } })
    if (!checkout) throw new NotFoundException('Checkout not found')
    return { ...checkout, amount: Number(checkout.amount) }
  }

  async receiveWebhook(event: SafepayEvent) {
    const tracker = event.data?.tracker
    if (!tracker) return { received: true }
    const checkout = await this.db.paymentCheckout.findUnique({ where: { tracker }, include: { invoice: true } })
    if (!checkout || [PaymentCheckoutStatus.SUCCEEDED, PaymentCheckoutStatus.CANCELLED].some((status) => status === checkout.status)) return { received: true }

    if (event.type === 'payment.failed') {
      await this.db.paymentCheckout.update({ where: { id: checkout.id }, data: { status: PaymentCheckoutStatus.FAILED } })
      return { received: true }
    }
    if (event.type !== 'payment.succeeded') return { received: true }
    const expectedMinor = Math.round(Number(checkout.amount) * 100)
    if (event.data?.currency !== 'PKR' || event.data?.amount !== expectedMinor) throw new BadRequestException('Payment webhook amount does not match the open checkout')

    await this.db.$transaction(async (tx) => {
      const current = await tx.paymentCheckout.findUnique({ where: { id: checkout.id } })
      if (!current || current.status === PaymentCheckoutStatus.SUCCEEDED) return
      const invoice = await tx.rentInvoice.findUnique({ where: { id: checkout.invoiceId } })
      if (!invoice || invoice.status === InvoiceStatus.CANCELLED) throw new BadRequestException('Invoice is no longer open')
      const paid = Number(invoice.amountPaid) + Number(current.amount)
      if (paid > Number(invoice.amount)) throw new BadRequestException('Payment would exceed the invoice balance')
      const balanceUpdate = await tx.rentInvoice.updateMany({
        where: { id: checkout.invoiceId, amountPaid: invoice.amountPaid, status: { not: InvoiceStatus.CANCELLED } },
        data: { amountPaid: { increment: current.amount }, status: paid >= Number(invoice.amount) ? InvoiceStatus.PAID : invoice.dueDate < new Date(new Date().setHours(0, 0, 0, 0)) ? InvoiceStatus.OVERDUE : InvoiceStatus.PARTIAL },
      })
      if (balanceUpdate.count !== 1) throw new BadRequestException('Invoice balance changed during payment confirmation')
      await tx.payment.create({ data: { invoiceId: checkout.invoiceId, payerId: checkout.payerId, amount: current.amount, method: PaymentMethod.CARD, reference: current.tracker } })
      await tx.paymentCheckout.update({ where: { id: current.id }, data: { status: PaymentCheckoutStatus.SUCCEEDED, completedAt: new Date() } })
    })
    return { received: true }
  }
}

@ApiTags('payments')
@ApiBearerAuth()
@Controller('rent-invoices')
@UseGuards(AuthGuard)
class PaymentsController {
  constructor(private payments: PaymentsService) {}
  @Post(':id/checkout') createCheckout(@Param('id') id: string, @Body() dto: CheckoutDto, @CurrentUser() user: AuthUser) { return this.payments.createCheckout(id, dto.amount, user) }
  @Get('checkout/:tracker') status(@Param('tracker') tracker: string, @CurrentUser() user: AuthUser) { return this.payments.checkoutStatus(tracker, user) }
  @Post('checkout/:tracker/cancel') cancel(@Param('tracker') tracker: string, @CurrentUser() user: AuthUser) { return this.payments.cancelCheckout(tracker, user) }
}

@Controller('safepay')
class SafepayWebhookController {
  constructor(private payments: PaymentsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Req() request: RawBodyRequest<Request>, @Headers('x-sfpy-signature') signature: string | undefined, @Body() body: SafepayEvent) {
    const secret = process.env.SAFEPAY_WEBHOOK_SECRET
    if (!secret || !request.rawBody || !signature) throw new BadRequestException('Payment webhook signature is not configured or missing')
    const expected = createHmac('sha512', secret).update(request.rawBody).digest()
    let received: Buffer
    try { received = Buffer.from(signature, 'hex') } catch { throw new BadRequestException('Invalid payment webhook signature') }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new BadRequestException('Invalid payment webhook signature')
    return this.payments.receiveWebhook(body)
  }
}

@Module({ imports: [AuthModule], controllers: [PaymentsController, SafepayWebhookController], providers: [PaymentsService, AuthGuard] })
export class PaymentsModule {}
