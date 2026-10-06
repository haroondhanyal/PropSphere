import { Body, ConflictException, Controller, Get, Injectable, Module, Param, Patch, Post, Query, UseGuards, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsDate, IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PrismaService } from './prisma.service'
import type { Prisma } from '@prisma/client'
import { AuthGuard, AuthUser, CurrentUser, Roles, RolesGuard } from './access'
import { AuthModule } from './auth.module'

class ProjectDto { @IsString() @MaxLength(120) name!: string; @IsString() city!: string; @IsOptional() @IsString() address?: string; @IsOptional() @IsString() description?: string }
class DevelopmentUnitDto { @IsString() projectId!: string; @IsString() unitNumber!: string; @Type(() => Number) @IsInt() floor!: number; @Type(() => Number) @IsInt() @Min(0) bedrooms!: number; @Type(() => Number) @IsInt() @Min(1) areaSqft!: number; @Type(() => Number) @IsNumber() @Min(1) price!: number }
class ReservationDto { @IsString() unitId!: string; @IsString() @MaxLength(120) customerName!: string; @IsEmail() customerEmail!: string; @IsOptional() @IsString() customerPhone?: string; @Type(() => Number) @IsNumber() @Min(1) deposit!: number }
class InstallmentDto { @IsString() @MaxLength(80) title!: string; @Type(() => Number) @IsNumber() @Min(1) amount!: number; @Type(() => Date) @IsDate() dueDate!: Date }
class StayDto { @IsString() @MaxLength(140) title!: string; @IsString() city!: string; @IsString() address!: string; @IsString() @MaxLength(2000) description!: string; @IsUrl({ protocols: ['https'], require_protocol: true }) imageUrl!: string; @Type(() => Number) @IsNumber() @Min(1) nightlyRate!: number; @Type(() => Number) @IsInt() @Min(1) maxGuests!: number; @Type(() => Number) @IsInt() @Min(0) bedrooms!: number }
class BookingDto { @IsString() stayId!: string; @Type(() => Date) @IsDate() checkIn!: Date; @Type(() => Date) @IsDate() checkOut!: Date; @Type(() => Number) @IsInt() @Min(1) guests!: number }
class ExpenseDto { @IsOptional() @IsString() propertyId?: string; @IsString() category!: string; @IsString() @MaxLength(300) description!: string; @Type(() => Number) @IsNumber() @Min(0.01) amount!: number; @IsOptional() @Type(() => Date) @IsDate() incurredAt?: Date }
class PayoutDto { @IsString() ownerId!: string; @Type(() => Number) @IsNumber() @Min(0.01) amount!: number; @IsString() period!: string; @IsOptional() @IsString() reference?: string }
class VendorBillDto { @IsString() maintenanceRequestId!: string; @IsString() @MaxLength(80) invoiceReference!: string; @IsString() @MaxLength(300) description!: string; @Type(() => Number) @IsNumber() @Min(0.01) amount!: number }

@Injectable()
class PhaseFourService {
  constructor(private db: PrismaService) {}
  private log(user: AuthUser, action: string, entity: string, entityId?: string, details?: object) { return this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action, entity, entityId, details } }) }
  projects(user: AuthUser) { return this.db.developmentProject.findMany({ where: { organizationId: user.organizationId }, include: { units: { orderBy: { unitNumber: 'asc' } } }, orderBy: { createdAt: 'desc' } }) }
  async createProject(dto: ProjectDto, user: AuthUser) { const project = await this.db.developmentProject.create({ data: { ...dto, organizationId: user.organizationId } }); await this.log(user, 'project.created', 'DevelopmentProject', project.id); return project }
  async createUnit(dto: DevelopmentUnitDto, user: AuthUser) { const project = await this.db.developmentProject.findFirst({ where: { id: dto.projectId, organizationId: user.organizationId } }); if (!project) throw new NotFoundException('Project not found'); return this.db.developmentUnit.create({ data: dto }) }
  units(user: AuthUser) { return this.db.developmentUnit.findMany({ where: { project: { organizationId: user.organizationId } }, include: { project: { select: { id: true, name: true } }, reservations: { where: { status: { in: ['PENDING', 'CONFIRMED'] } }, take: 1 } }, orderBy: [{ project: { name: 'asc' } }, { unitNumber: 'asc' }] }) }
  async reserve(dto: ReservationDto, user: AuthUser) {
    const unit = await this.db.developmentUnit.findFirst({ where: { id: dto.unitId, project: { organizationId: user.organizationId } } })
    if (!unit) throw new NotFoundException('Development unit not found')
    if (unit.status !== 'AVAILABLE') throw new ConflictException('This unit is no longer available')
    if (dto.deposit > Number(unit.price)) throw new BadRequestException('Deposit cannot exceed the unit price')
    const reservation = await this.db.$transaction(async (tx) => {
      const claimed = await tx.developmentUnit.updateMany({ where: { id: unit.id, status: 'AVAILABLE' }, data: { status: 'RESERVED' } })
      if (!claimed.count) throw new ConflictException('This unit is no longer available')
      const created = await tx.reservation.create({ data: { organizationId: user.organizationId, ...dto } })
      return created
    })
    await this.log(user, 'reservation.created', 'Reservation', reservation.id)
    return reservation
  }
  reservations(user: AuthUser) { return this.db.reservation.findMany({ where: { organizationId: user.organizationId }, include: { unit: { include: { project: true } }, installments: { orderBy: { dueDate: 'asc' } } }, orderBy: { createdAt: 'desc' } }) }
  async updateReservation(id: string, status: string, user: AuthUser) {
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) throw new BadRequestException('Choose CONFIRMED or CANCELLED')
    const reservation = await this.db.reservation.findFirst({ where: { id, organizationId: user.organizationId }, include: { unit: true } })
    if (!reservation) throw new NotFoundException('Reservation not found')
    if (reservation.status !== 'PENDING') throw new ConflictException('Only pending reservations can be confirmed or cancelled')
    const updated = await this.db.$transaction(async (tx) => {
      const item = await tx.reservation.update({ where: { id }, data: { status } })
      await tx.developmentUnit.update({ where: { id: reservation.unitId }, data: { status: status === 'CANCELLED' ? 'AVAILABLE' : 'SOLD' } })
      return item
    })
    await this.log(user, `reservation.${status.toLowerCase()}`, 'Reservation', id)
    return updated
  }
  async addInstallment(id: string, dto: InstallmentDto, user: AuthUser) { const reservation = await this.db.reservation.findFirst({ where: { id, organizationId: user.organizationId, status: 'CONFIRMED' }, include: { unit: true } }); if (!reservation) throw new NotFoundException('Confirmed reservation not found'); const due = await this.db.installment.aggregate({ where: { reservationId: id }, _sum: { amount: true } }); if (Number(reservation.deposit) + Number(due._sum.amount || 0) + dto.amount > Number(reservation.unit.price)) throw new BadRequestException('Installments and deposit cannot exceed the unit price'); return this.db.installment.create({ data: { reservationId: id, ...dto } }) }
  async payInstallment(id: string, user: AuthUser) { const result = await this.db.installment.updateMany({ where: { id, reservation: { organizationId: user.organizationId }, status: 'DUE' }, data: { status: 'PAID', paidAt: new Date() } }); if (!result.count) throw new NotFoundException('Due installment not found'); await this.log(user, 'installment.paid', 'Installment', id); return { paid: true } }
  stays(city?: string) { return this.db.stayListing.findMany({ where: { active: true, ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}) }, orderBy: { createdAt: 'desc' } }) }
  async createStay(dto: StayDto, user: AuthUser) { const stay = await this.db.stayListing.create({ data: { ...dto, organizationId: user.organizationId } }); await this.log(user, 'stay.created', 'StayListing', stay.id); return stay }
  bookings(user: AuthUser) { return this.db.stayBooking.findMany({ where: ['BUYER', 'TENANT'].includes(user.role) ? { guestId: user.sub } : { organizationId: user.organizationId }, include: { stay: true }, orderBy: { checkIn: 'asc' } }) }
  async book(dto: BookingDto, user: AuthUser) {
    if (dto.checkOut <= dto.checkIn) throw new BadRequestException('Check-out must be after check-in')
    const stay = await this.db.stayListing.findFirst({ where: { id: dto.stayId, active: true } })
    if (!stay) throw new NotFoundException('Stay listing not found')
    if (dto.guests > stay.maxGuests) throw new BadRequestException(`This home allows up to ${stay.maxGuests} guests`)
    const nights = Math.ceil((dto.checkOut.getTime() - dto.checkIn.getTime()) / 86400000)
    const booking = await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${stay.id})::bigint)`
      const overlap = await tx.stayBooking.findFirst({ where: { stayId: stay.id, status: { in: ['REQUESTED', 'CONFIRMED'] }, checkIn: { lt: dto.checkOut }, checkOut: { gt: dto.checkIn } } })
      if (overlap) throw new ConflictException('These dates are not available')
      return tx.stayBooking.create({ data: { ...dto, guestId: user.sub, organizationId: stay.organizationId, nightlyRate: stay.nightlyRate, totalAmount: Number(stay.nightlyRate) * nights } })
    })
    await this.log(user, 'stay_booking.created', 'StayBooking', booking.id)
    return booking
  }
  async updateBooking(id: string, status: string, user: AuthUser) {
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) throw new BadRequestException('Choose CONFIRMED or CANCELLED')
    if (['BUYER', 'TENANT'].includes(user.role) && status !== 'CANCELLED') throw new ForbiddenException('Only the listing team can confirm a stay')
    const booking = await this.db.stayBooking.findFirst({ where: { id, ...(['BUYER', 'TENANT'].includes(user.role) ? { guestId: user.sub } : { organizationId: user.organizationId }) } })
    if (!booking) throw new NotFoundException('Stay booking not found')
    if (!['REQUESTED', 'CONFIRMED'].includes(booking.status)) throw new ConflictException('This booking is already closed')
    const updated = await this.db.stayBooking.update({ where: { id }, data: { status } })
    await this.log(user, `stay_booking.${status.toLowerCase()}`, 'StayBooking', id)
    return updated
  }
  async expense(dto: ExpenseDto, user: AuthUser) { if (user.role === 'OWNER' && !dto.propertyId) throw new BadRequestException('Choose one of your properties for this expense'); if (dto.propertyId && !(await this.db.property.findFirst({ where: { id: dto.propertyId, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { createdById: user.sub } : {}) } }))) throw new NotFoundException('Property not found in your workspace'); const result = await this.db.expense.create({ data: { ...dto, organizationId: user.organizationId, createdById: user.sub } }); await this.log(user, 'expense.created', 'Expense', result.id); return result }
  vendorBills(user: AuthUser) { return this.db.vendorBill.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'VENDOR' ? { vendor: { userId: user.sub } } : user.role === 'OWNER' ? { maintenanceRequest: { property: { createdById: user.sub } } } : {}) }, include: { vendor: true, maintenanceRequest: { include: { property: { select: { id: true, title: true } } } }, }, orderBy: { submittedAt: 'desc' }, take: 200 }) }
  async submitVendorBill(dto: VendorBillDto, user: AuthUser) {
    const vendor = await this.db.vendor.findFirst({ where: { organizationId: user.organizationId, userId: user.sub, active: true } })
    if (!vendor) throw new ForbiddenException('Your account is not linked to an active vendor profile')
    const job = await this.db.maintenanceRequest.findFirst({ where: { id: dto.maintenanceRequestId, organizationId: user.organizationId, vendorId: vendor.id, status: 'COMPLETED' } })
    if (!job) throw new BadRequestException('Only completed jobs assigned to your vendor profile can be billed')
    if (await this.db.vendorBill.findUnique({ where: { maintenanceRequestId: job.id } })) throw new ConflictException('This completed job already has an invoice')
    const bill = await this.db.vendorBill.create({ data: { ...dto, organizationId: user.organizationId, vendorId: vendor.id } })
    await this.log(user, 'vendor_bill.submitted', 'VendorBill', bill.id)
    return bill
  }
  async updateVendorBill(id: string, status: string, user: AuthUser) {
    if (!['APPROVED', 'REJECTED', 'PAID'].includes(status)) throw new BadRequestException('Choose approved, rejected, or paid')
    const bill = await this.db.vendorBill.findFirst({ where: { id, organizationId: user.organizationId }, include: { maintenanceRequest: true, vendor: { select: { name: true } } } })
    if (!bill) throw new NotFoundException('Vendor invoice not found')
    if (status === 'PAID') {
      if (bill.status !== 'APPROVED') throw new ConflictException('Approve the vendor invoice before recording payment')
      return this.db.$transaction(async (tx) => {
        const claimed = await tx.vendorBill.updateMany({ where: { id, status: 'APPROVED' }, data: { status: 'PAID', paidAt: new Date(), reviewedById: user.sub, reviewedAt: new Date() } })
        if (!claimed.count) throw new ConflictException('This invoice was already updated')
        const expense = await tx.expense.create({ data: { organizationId: user.organizationId, propertyId: bill.maintenanceRequest.propertyId, category: 'Vendor bill', description: `${bill.vendor.name} · ${bill.description}`, amount: bill.amount, createdById: user.sub } })
        await this.auditTransaction(tx, user, 'vendor_bill.paid', 'VendorBill', id)
        await this.auditTransaction(tx, user, 'expense.created', 'Expense', expense.id)
        return { paid: true }
      })
    }
    if (bill.status !== 'PENDING') throw new ConflictException('Only pending vendor invoices can be approved or rejected')
    const changed = await this.db.vendorBill.updateMany({ where: { id, status: 'PENDING' }, data: { status, reviewedById: user.sub, reviewedAt: new Date() } })
    if (!changed.count) throw new ConflictException('This invoice was already reviewed')
    await this.log(user, `vendor_bill.${status.toLowerCase()}`, 'VendorBill', id)
    return { status }
  }
  private auditTransaction(tx: Prisma.TransactionClient, user: AuthUser, action: string, entity: string, entityId: string) { return tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action, entity, entityId } }) }
  async payout(dto: PayoutDto, user: AuthUser) { const owner = await this.db.organizationMembership.findFirst({ where: { userId: dto.ownerId, organizationId: user.organizationId, role: 'OWNER' } }); if (!owner) throw new NotFoundException('Owner not found'); const result = await this.db.ownerPayout.create({ data: { ...dto, organizationId: user.organizationId } }); await this.log(user, 'payout.created', 'OwnerPayout', result.id); return result }
  async finance(user: AuthUser, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : undefined
    const toDate = to ? new Date(to) : undefined
    if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) throw new BadRequestException('Use valid calendar dates')
    if (fromDate && toDate && fromDate > toDate) throw new BadRequestException('The start date must come before the end date')
    if (toDate) toDate.setUTCHours(23, 59, 59, 999)
    const range = { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) }
    const propertyScope = user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}
    const [payments, expenses, payouts] = await Promise.all([
      this.db.payment.aggregate({ where: { invoice: { lease: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) } }, ...(fromDate || toDate ? { paidAt: range } : {}) }, _sum: { amount: true }, _count: true }),
      this.db.expense.aggregate({ where: { organizationId: user.organizationId, ...propertyScope, ...(fromDate || toDate ? { incurredAt: range } : {}) }, _sum: { amount: true }, _count: true }),
      this.db.ownerPayout.aggregate({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}), ...(fromDate || toDate ? { createdAt: range } : {}) }, _sum: { amount: true }, _count: true }),
    ])
    return { income: Number(payments._sum.amount || 0), expenses: Number(expenses._sum.amount || 0), payouts: Number(payouts._sum.amount || 0), paymentCount: payments._count, expenseCount: expenses._count, payoutCount: payouts._count }
  }
  expenseList(user: AuthUser) { return this.db.expense.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }, orderBy: { incurredAt: 'desc' }, take: 200 }) }
  payoutList(user: AuthUser) { return this.db.ownerPayout.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) }, orderBy: { createdAt: 'desc' }, take: 200 }) }
  owners(user: AuthUser) { return this.db.organizationMembership.findMany({ where: { organizationId: user.organizationId, role: 'OWNER' }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'asc' } }).then((members) => members.map(({ user: owner }) => owner)) }
  async markPayoutPaid(id: string, user: AuthUser) { const updated = await this.db.ownerPayout.updateMany({ where: { id, organizationId: user.organizationId, status: 'PENDING' }, data: { status: 'PAID', paidAt: new Date() } }); if (!updated.count) throw new NotFoundException('Pending payout not found'); await this.log(user, 'payout.paid', 'OwnerPayout', id); return { paid: true } }
}

@ApiTags('developments, stays and finance') @ApiBearerAuth() @UseGuards(AuthGuard)
@Controller()
class PhaseFourController {
  constructor(private service: PhaseFourService) {}
  @Get('developments') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'DEVELOPER') projects(@CurrentUser() user: AuthUser) { return this.service.projects(user) }
  @Post('developments') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'DEVELOPER') createProject(@Body() dto: ProjectDto, @CurrentUser() user: AuthUser) { return this.service.createProject(dto, user) }
  @Get('development-units') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'DEVELOPER') units(@CurrentUser() user: AuthUser) { return this.service.units(user) }
  @Post('development-units') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'DEVELOPER') createUnit(@Body() dto: DevelopmentUnitDto, @CurrentUser() user: AuthUser) { return this.service.createUnit(dto, user) }
  @Get('reservations') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'DEVELOPER', 'FINANCE') reservations(@CurrentUser() user: AuthUser) { return this.service.reservations(user) }
  @Post('reservations') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'DEVELOPER') reserve(@Body() dto: ReservationDto, @CurrentUser() user: AuthUser) { return this.service.reserve(dto, user) }
  @Patch('reservations/:id/status') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'DEVELOPER') updateReservation(@Param('id') id: string, @Body('status') status: string, @CurrentUser() user: AuthUser) { return this.service.updateReservation(id, status, user) }
  @Post('reservations/:id/installments') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'DEVELOPER', 'FINANCE') addInstallment(@Param('id') id: string, @Body() dto: InstallmentDto, @CurrentUser() user: AuthUser) { return this.service.addInstallment(id, dto, user) }
  @Patch('installments/:id/paid') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') payInstallment(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.payInstallment(id, user) }
  @Post('stays') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER') createStay(@Body() dto: StayDto, @CurrentUser() user: AuthUser) { return this.service.createStay(dto, user) }
  @Get('stay-bookings') bookings(@CurrentUser() user: AuthUser) { return this.service.bookings(user) }
  @Post('stay-bookings') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'BUYER', 'TENANT') book(@Body() dto: BookingDto, @CurrentUser() user: AuthUser) { return this.service.book(dto, user) }
  @Patch('stay-bookings/:id/status') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'BUYER', 'TENANT') updateBooking(@Param('id') id: string, @Body('status') status: string, @CurrentUser() user: AuthUser) { return this.service.updateBooking(id, status, user) }
  @Get('finance/report') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') report(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) { return this.service.finance(user, from, to) }
  @Get('finance/expenses') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') expenses(@CurrentUser() user: AuthUser) { return this.service.expenseList(user) }
  @Post('finance/expenses') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') createExpense(@Body() dto: ExpenseDto, @CurrentUser() user: AuthUser) { return this.service.expense(dto, user) }
  @Get('vendor-bills') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE', 'VENDOR') vendorBills(@CurrentUser() user: AuthUser) { return this.service.vendorBills(user) }
  @Post('vendor-bills') @UseGuards(RolesGuard) @Roles('VENDOR') submitVendorBill(@Body() dto: VendorBillDto, @CurrentUser() user: AuthUser) { return this.service.submitVendorBill(dto, user) }
  @Patch('vendor-bills/:id/status') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') updateVendorBill(@Param('id') id: string, @Body('status') status: string, @CurrentUser() user: AuthUser) { return this.service.updateVendorBill(id, status, user) }
  @Get('finance/payouts') @UseGuards(RolesGuard) @Roles('ADMIN', 'OWNER', 'FINANCE') payouts(@CurrentUser() user: AuthUser) { return this.service.payoutList(user) }
  @Get('finance/owners') @UseGuards(RolesGuard) @Roles('ADMIN', 'FINANCE') owners(@CurrentUser() user: AuthUser) { return this.service.owners(user) }
  @Post('finance/payouts') @UseGuards(RolesGuard) @Roles('ADMIN', 'FINANCE') createPayout(@Body() dto: PayoutDto, @CurrentUser() user: AuthUser) { return this.service.payout(dto, user) }
  @Patch('finance/payouts/:id/paid') @UseGuards(RolesGuard) @Roles('ADMIN', 'FINANCE') markPayoutPaid(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.markPayoutPaid(id, user) }
}

@ApiTags('stays')
@Controller('stays')
class PublicStaysController {
  constructor(private service: PhaseFourService) {}
  @Get() stays(@Query('city') city?: string) { return this.service.stays(city) }
}

@Module({ imports: [AuthModule], controllers: [PhaseFourController, PublicStaysController], providers: [PhaseFourService, AuthGuard, RolesGuard] })
export class PhaseFourModule {}
