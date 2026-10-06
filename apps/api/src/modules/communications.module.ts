import { Body, Controller, Injectable, Logger, Module, Post, ServiceUnavailableException } from '@nestjs/common'
import { IsEmail, IsString, MaxLength } from 'class-validator'
import { Cron } from '@nestjs/schedule'
import nodemailer, { Transporter } from 'nodemailer'
import type { Prisma } from '@prisma/client'
import { PrismaService } from './prisma.service'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly transport: Transporter | null

  constructor() {
    const host = process.env.SMTP_HOST
    this.transport = host ? nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || '' } } : {}),
    }) : null
  }

  get ready() { return !!this.transport && !!process.env.SMTP_FROM }

  async send(to: string, subject: string, text: string, html: string) {
    if (!this.ready || !this.transport) return false
    await this.transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html })
    return true
  }
}

class ContactMessageDto {
  @IsString() @MaxLength(100) name!: string
  @IsEmail() email!: string
  @IsString() @MaxLength(100) topic!: string
  @IsString() @MaxLength(2000) message!: string
}

@Controller('contact')
class ContactController {
  constructor(private email: EmailService) {}

  @Post()
  async send(@Body() dto: ContactMessageDto) {
    const recipient = process.env.CONTACT_EMAIL || process.env.SMTP_FROM
    if (!recipient || !this.email.ready) throw new ServiceUnavailableException('Contact email delivery is not configured yet.')
    const text = `Website contact request\n\nFrom: ${dto.name} <${dto.email}>\nTopic: ${dto.topic}\n\n${dto.message}`
    const html = `<h2>PropSphere website contact request</h2><p><b>From:</b> ${escapeHtml(dto.name)} &lt;${escapeHtml(dto.email)}&gt;</p><p><b>Topic:</b> ${escapeHtml(dto.topic)}</p><p>${escapeHtml(dto.message).replace(/\n/g, '<br/>')}</p>`
    const sent = await this.email.send(recipient, `PropSphere contact: ${dto.topic.replace(/[\r\n]/g, ' ').slice(0, 100)}`, text, html)
    if (!sent) throw new ServiceUnavailableException('Contact email delivery is not configured yet.')
    return { message: 'Thanks for reaching out. Your message has been sent to our team.' }
  }
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  constructor(private db: PrismaService, private email: EmailService) {}

  async inboxMessage(inquiryId: string, senderId: string, body: string) {
    if (!this.email.ready) return
    try {
      const inquiry = await this.db.inquiry.findUnique({ where: { id: inquiryId }, include: { property: true, sender: true } })
      if (!inquiry) return
      let recipient: { email: string; name: string } | null = null
      if (senderId === inquiry.senderId) {
        const lead = await this.db.lead.findFirst({ where: { organizationId: inquiry.organizationId, propertyId: inquiry.propertyId, customerId: senderId }, include: { assignedTo: true } })
        const agent = lead?.assignedTo || await this.db.user.findFirst({ where: { organizationId: inquiry.organizationId, role: 'AGENT' }, orderBy: { createdAt: 'asc' } })
        recipient = agent ? { email: agent.email, name: agent.name } : null
      } else {
        recipient = { email: inquiry.sender.email, name: inquiry.sender.name }
      }
      if (!recipient) return
      const propertyUrl = `${process.env.WEB_URL || 'http://127.0.0.1:5173'}/property/${encodeURIComponent(inquiry.property.slug)}`
      const text = `Hi ${recipient.name}, there is a new message about ${inquiry.property.title}:\n\n${body}\n\nOpen listing: ${propertyUrl}`
      await this.email.send(recipient.email, `New PropSphere message: ${inquiry.property.title}`, text, `<p>Hi ${escapeHtml(recipient.name)},</p><p>There is a new message about <b>${escapeHtml(inquiry.property.title)}</b>:</p><blockquote>${escapeHtml(body)}</blockquote><p><a href="${propertyUrl}">Open listing</a></p>`)
    } catch (error) {
      this.logger.warn(`Could not send inbox notification: ${String(error)}`)
    }
  }

  @Cron('0 9 * * *', { timeZone: 'Asia/Karachi' })
  async savedSearchAlerts() {
    if (!this.email.ready) return
    const searches = await this.db.savedSearch.findMany({ where: { alertEnabled: true }, include: { user: { select: { email: true, name: true } } }, take: 500 })
    for (const saved of searches) {
      try {
        const filters = (saved.filters || {}) as Record<string, unknown>
        const city = typeof filters.city === 'string' ? filters.city.trim() : ''
        const purpose = filters.purpose === 'SALE' || filters.purpose === 'RENT' ? filters.purpose : undefined
        const types = ['APARTMENT', 'HOUSE', 'VILLA', 'PENTHOUSE', 'STUDIO', 'OFFICE', 'SHOP', 'LAND']
        const type = typeof filters.type === 'string' && types.includes(filters.type) ? filters.type : undefined
        const numberFilter = (key: string) => {
          const value = Number(filters[key])
          return Number.isFinite(value) && value >= 0 ? value : undefined
        }
        const minPrice = numberFilter('minPrice')
        const maxPrice = Number(filters.maxPrice)
        const minBedrooms = numberFilter('minBedrooms')
        const minBathrooms = numberFilter('minBathrooms')
        const minArea = numberFilter('minArea')
        const maxArea = numberFilter('maxArea')
        const where: Prisma.PropertyWhereInput = {
          status: 'PUBLISHED',
          createdAt: { gt: saved.lastAlertedAt || saved.createdAt },
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
          ...(purpose ? { purpose } : {}),
          ...(type ? { type: type as never } : {}),
          ...(minPrice !== undefined || (Number.isFinite(maxPrice) && maxPrice > 0) ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(Number.isFinite(maxPrice) && maxPrice > 0 ? { lte: maxPrice } : {}) } } : {}),
          ...(minBedrooms !== undefined ? { bedrooms: { gte: minBedrooms } } : {}),
          ...(minBathrooms !== undefined ? { bathrooms: { gte: minBathrooms } } : {}),
          ...(minArea !== undefined || maxArea !== undefined ? { areaSqft: { ...(minArea !== undefined ? { gte: minArea } : {}), ...(maxArea !== undefined ? { lte: maxArea } : {}) } } : {}),
        }
        const properties = await this.db.property.findMany({
          where,
          select: { title: true, city: true, price: true, slug: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
        if (!properties.length) continue
        const baseUrl = process.env.WEB_URL || 'http://127.0.0.1:5173'
        const items = properties.map((property) => ({ ...property, url: `${baseUrl}/property/${encodeURIComponent(property.slug)}` }))
        const text = `Hi ${saved.user.name}, new properties match “${saved.name}”:\n\n${items.map((p) => `${p.title} · ${p.city} · PKR ${Number(p.price).toLocaleString()} — ${p.url}`).join('\n')}\n\nManage saved searches: ${baseUrl}/workspace/searches`
        const html = `<p>Hi ${escapeHtml(saved.user.name)},</p><p>New properties match <b>${escapeHtml(saved.name)}</b>:</p><ul>${items.map((p) => `<li><a href="${p.url}">${escapeHtml(p.title)}</a> · ${escapeHtml(p.city)} · PKR ${Number(p.price).toLocaleString()}</li>`).join('')}</ul><p><a href="${baseUrl}/workspace/searches">Manage saved searches</a></p>`
        const sent = await this.email.send(saved.user.email, `New homes match your PropSphere search: ${saved.name}`, text, html)
        if (sent) await this.db.savedSearch.update({ where: { id: saved.id }, data: { lastAlertedAt: new Date() } })
      } catch (error) {
        this.logger.warn(`Saved search alert failed for ${saved.id}: ${String(error)}`)
      }
    }
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

@Module({ controllers: [ContactController], providers: [EmailService, NotificationsService], exports: [EmailService, NotificationsService] })
export class CommunicationsModule {}
