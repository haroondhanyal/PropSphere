import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, ParseEnumPipe, Patch, Post, UseGuards, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ApplicationStatus, InvoiceStatus, LeadStage, LeaseStatus, ListingStatus, MaintenanceStatus, OfferStatus, PaymentCheckoutStatus, PaymentMethod, Priority, PropertyPurpose, Role, ViewingMode, ViewingStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { IsBoolean, IsDate, IsEmail, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PrismaService } from './prisma.service'
import { AuthGuard, AuthUser, CurrentUser, Roles, RolesGuard } from './access'
import { AuthModule } from './auth.module'
import { CommunicationsModule, NotificationsService } from './communications.module'

class InquiryDto { @IsString() propertyId!: string; @IsString() @MaxLength(1200) message!: string; @IsOptional() @IsString() @MaxLength(40) phone?: string }
class ViewingDto { @IsString() propertyId!: string; @Type(() => Date) @IsDate() scheduledAt!: Date; @IsOptional() @IsEnum(ViewingMode) mode?: ViewingMode; @IsOptional() @IsString() notes?: string }
class OfferDto { @IsString() propertyId!: string; @Type(() => Number) @IsNumber() @Min(1) amount!: number; @IsOptional() @IsString() message?: string }
class ApplicationDto { @IsString() propertyId!: string; @IsOptional() @Type(() => Number) @IsNumber() @Min(0) monthlyIncome?: number; @IsOptional() @IsString() employment?: string; @IsOptional() @IsString() message?: string }
class StageDto { @IsEnum(LeadStage) stage!: LeadStage; @IsOptional() @IsString() notes?: string }
class ActivityDto { @IsString() kind!: string; @IsString() @MaxLength(1200) body!: string }
class LeaseDto { @Type(() => Date) @IsDate() startDate!: Date; @Type(() => Date) @IsDate() endDate!: Date; @Type(() => Number) @IsNumber() @Min(1) monthlyRent!: number; @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deposit?: number; @IsOptional() @IsString() unitId?: string }
class PaymentDto { @Type(() => Number) @IsNumber() @Min(1) amount!: number; @IsEnum(PaymentMethod) method!: PaymentMethod }
class MaintenanceDto { @IsString() propertyId!: string; @IsString() @MaxLength(100) title!: string; @IsString() @MaxLength(2000) description!: string; @IsString() category!: string; @IsOptional() @IsEnum(Priority) priority?: Priority }
class VendorDto { @IsString() name!: string; @IsString() service!: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsEmail() email?: string }
class AssignVendorDto { @IsString() vendorId!: string; @IsOptional() @Type(() => Number) @IsNumber() @Min(0) quotedCost?: number }
class UnitDto { @IsString() propertyId!: string; @IsString() unitNumber!: string; @Type(() => Number) @IsInt() @Min(0) bedrooms!: number; @Type(() => Number) @IsNumber() @Min(1) monthlyRent!: number }
class SavedSearchDto { @IsString() name!: string; @IsObject() filters!: Record<string, unknown> }
class SavedSearchAlertDto { @IsBoolean() enabled!: boolean }
class TaskDto { @IsString() @MaxLength(140) title!: string; @IsOptional() @Type(() => Date) @IsDate() dueAt?: Date }
class OfferDecisionDto { @IsEnum(OfferStatus) status!: OfferStatus; @IsOptional() @Type(() => Number) @IsNumber() @Min(1) amount?: number; @IsOptional() @IsString() message?: string }
class InquiryMessageDto { @IsString() @MaxLength(1200) body!: string }
class OfferResponseDto { @IsEnum(OfferStatus) status!: OfferStatus; @IsOptional() @Type(() => Number) @IsNumber() @Min(1) amount?: number; @IsOptional() @IsString() message?: string }

@Injectable()
class WorkflowsService {
  constructor(private db: PrismaService, private notifications: NotificationsService) {}
  private audit(tx: Prisma.TransactionClient, user: AuthUser, action: string, entity: string, entityId: string) { return tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action, entity, entityId } }) }
  private async activeProperty(id: string) {
    const property = await this.db.property.findFirst({ where: { id, status: ListingStatus.PUBLISHED } })
    if (!property) throw new NotFoundException('Published property not found')
    return property
  }
  async overview(user: AuthUser) {
    const org = user.organizationId
    const elevated = ['ADMIN', 'OWNER', 'AGENT', 'SALES_MANAGER'].includes(user.role)
    const [propertyCount, units, leadCount, viewings, offers, applications, leases, invoices, maintenance] = await Promise.all([
      this.db.property.count({ where: user.role === 'OWNER' ? { organizationId: org, createdById: user.sub } : elevated ? { organizationId: org } : { organizationId: org, status: ListingStatus.PUBLISHED } }),
      ['BUYER', 'TENANT'].includes(user.role) ? Promise.resolve([]) : this.db.propertyUnit.groupBy({ by: ['status'], where: { organizationId: org, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }, _count: { _all: true } }),
      this.db.lead.count({ where: { organizationId: org, ...(user.role === 'AGENT' ? { assignedToId: user.sub } : {}) } }),
      this.db.viewing.count({ where: user.role === 'BUYER' || user.role === 'TENANT' ? { requesterId: user.sub } : { organizationId: org, ...(user.role === 'AGENT' ? { agentId: user.sub } : {}) } }),
      this.db.offer.count({ where: user.role === 'BUYER' ? { buyerId: user.sub } : { organizationId: org } }),
      this.db.rentalApplication.count({ where: user.role === 'BUYER' || user.role === 'TENANT' ? { applicantId: user.sub } : { organizationId: org } }),
      this.db.lease.count({ where: ['BUYER', 'TENANT'].includes(user.role) ? { tenantId: user.sub } : user.role === 'OWNER' ? { organizationId: org, ownerId: user.sub } : { organizationId: org, status: 'ACTIVE' } }),
      this.db.rentInvoice.count({ where: { lease: ['BUYER', 'TENANT'].includes(user.role) ? { tenantId: user.sub } : { organizationId: org, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) }, status: { in: [InvoiceStatus.DUE, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] } } }),
      this.db.maintenanceRequest.count({ where: user.role === 'TENANT' || user.role === 'BUYER' ? { requesterId: user.sub } : { organizationId: org, status: { not: MaintenanceStatus.CLOSED } } }),
    ])
    return { propertyCount, units, leadCount, viewings, offers, applications, leases, invoicesDue: invoices, maintenanceOpen: maintenance }
  }
  async savedSearches(user: AuthUser) { return this.db.savedSearch.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' } }) }
  async createSavedSearch(dto: SavedSearchDto, user: AuthUser) { return this.db.savedSearch.create({ data: { userId: user.sub, name: dto.name, filters: dto.filters as Prisma.InputJsonValue } }) }
  async deleteSavedSearch(id: string, user: AuthUser) { const result = await this.db.savedSearch.deleteMany({ where: { id, userId: user.sub } }); if (!result.count) throw new NotFoundException('Saved search not found'); return { deleted: true } }
  async setSavedSearchAlerts(id: string, enabled: boolean, user: AuthUser) { const result = await this.db.savedSearch.updateMany({ where: { id, userId: user.sub }, data: { alertEnabled: enabled } }); if (!result.count) throw new NotFoundException('Saved search not found'); return { enabled } }
  async tasks(user: AuthUser) { return this.db.task.findMany({ where: { organizationId: user.organizationId, assignedToId: user.sub }, orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }] }) }
  async createTask(dto: TaskDto, user: AuthUser) { return this.db.task.create({ data: { organizationId: user.organizationId, assignedToId: user.sub, ...dto } }) }
  async completeTask(id: string, user: AuthUser) { const task = await this.db.task.findFirst({ where: { id, organizationId: user.organizationId, assignedToId: user.sub } }); if (!task) throw new NotFoundException('Task not found'); return this.db.task.update({ where: { id }, data: { completedAt: task.completedAt ? null : new Date() } }) }
  async ownerStatement(user: AuthUser) {
    const where = { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) }
    const [leases, paidInvoices, costs] = await Promise.all([
      this.db.lease.findMany({ where, include: { property: true, tenant: { select: { name: true } } } }),
      this.db.payment.findMany({ where: { invoice: { lease: where } }, include: { invoice: { include: { lease: { include: { property: true } } } } } }),
      this.db.maintenanceRequest.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}), quotedCost: { not: null } }, include: { property: { select: { id: true } } } }),
    ])
    const propertyMap = new Map<string, { property: string; rentCollected: number; maintenanceCost: number }>()
    for (const lease of leases) propertyMap.set(lease.propertyId, { property: lease.property.title, rentCollected: 0, maintenanceCost: 0 })
    for (const payment of paidInvoices) { const id = payment.invoice.lease.propertyId; const row = propertyMap.get(id) || { property: payment.invoice.lease.property.title, rentCollected: 0, maintenanceCost: 0 }; row.rentCollected += Number(payment.amount); propertyMap.set(id, row) }
    for (const item of costs) { const row = propertyMap.get(item.property.id); if (row) row.maintenanceCost += Number(item.quotedCost || 0) }
    const rows = [...propertyMap.entries()].map(([propertyId, row]) => ({ propertyId, ...row, netIncome: row.rentCollected - row.maintenanceCost }))
    return { rows, totals: rows.reduce((sum, row) => ({ rentCollected: sum.rentCollected + row.rentCollected, maintenanceCost: sum.maintenanceCost + row.maintenanceCost, netIncome: sum.netIncome + row.netIncome }), { rentCollected: 0, maintenanceCost: 0, netIncome: 0 }) }
  }
  async createInquiry(dto: InquiryDto, user: AuthUser) {
    const property = await this.activeProperty(dto.propertyId)
    const agents = await this.db.user.findMany({ where: { organizationId: property.organizationId, role: Role.AGENT }, take: 1, orderBy: { createdAt: 'asc' } })
    const assignedToId = agents[0]?.id || property.createdById
    const customer = await this.db.user.findUniqueOrThrow({ where: { id: user.sub } })
    const created = await this.db.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.create({ data: { organizationId: property.organizationId, propertyId: property.id, senderId: user.sub, message: dto.message } })
      await tx.inquiryMessage.create({ data: { inquiryId: inquiry.id, senderId: user.sub, body: dto.message } })
      const lead = await tx.lead.create({ data: { organizationId: property.organizationId, propertyId: property.id, customerId: customer.id, assignedToId, name: customer.name, email: customer.email, phone: dto.phone, stage: LeadStage.NEW, notes: dto.message } })
      return { inquiry, lead }
    })
    await this.notifications.inboxMessage(created.inquiry.id, user.sub, dto.message)
    return created
  }
  async listInquiries(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { senderId: user.sub } : { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }
    return this.db.inquiry.findMany({ where, include: { property: true, sender: { select: { id: true, name: true, email: true } }, messages: { include: { sender: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 100 })
  }
  async sendInquiryMessage(id: string, dto: InquiryMessageDto, user: AuthUser) {
    const inquiry = await this.db.inquiry.findFirst({ where: { id, ...(['BUYER', 'TENANT'].includes(user.role) ? { senderId: user.sub } : { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }) } })
    if (!inquiry) throw new NotFoundException('Conversation not found in your workspace')
    const message = await this.db.inquiryMessage.create({ data: { inquiryId: id, senderId: user.sub, body: dto.body } })
    await this.notifications.inboxMessage(id, user.sub, dto.body)
    return message
  }
  async listLeads(user: AuthUser) {
    return this.db.lead.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'AGENT' ? { assignedToId: user.sub } : {}) }, include: { property: true, customer: { select: { id: true, name: true, email: true } }, activities: { orderBy: { createdAt: 'desc' } } }, orderBy: { updatedAt: 'desc' }, take: 100 })
  }
  async salesTeam(user: AuthUser) {
    const members = await this.db.organizationMembership.findMany({ where: { organizationId: user.organizationId, role: Role.AGENT }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { user: { name: 'asc' } } })
    const leads = await this.db.lead.findMany({ where: { organizationId: user.organizationId, assignedToId: { in: members.map((m) => m.user.id) } }, select: { assignedToId: true, stage: true, property: { select: { price: true } } } })
    return members.map(({ user: member }) => {
      const assigned = leads.filter((lead) => lead.assignedToId === member.id)
      const won = assigned.filter((lead) => lead.stage === LeadStage.WON)
      return { ...member, assignedLeads: assigned.length, openLeads: assigned.filter((lead) => lead.stage !== LeadStage.WON && lead.stage !== LeadStage.LOST).length, won: won.length, lost: assigned.filter((lead) => lead.stage === LeadStage.LOST).length, estimatedWonValue: won.reduce((total, lead) => total + Number(lead.property?.price || 0), 0) }
    })
  }
  async updateLead(id: string, dto: StageDto, user: AuthUser) {
    const lead = await this.db.lead.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'AGENT' ? { assignedToId: user.sub } : {}) } })
    if (!lead) throw new NotFoundException('Lead not found in your workspace')
    return this.db.$transaction(async (tx) => {
      const updated = await tx.lead.update({ where: { id }, data: { stage: dto.stage, ...(dto.notes ? { notes: dto.notes } : {}) } })
      await tx.leadActivity.create({ data: { leadId: id, actorId: user.sub, kind: 'STAGE_CHANGED', body: dto.notes || `Moved to ${dto.stage.toLowerCase()}` } })
      await this.audit(tx, user, 'lead.stage_changed', 'Lead', id)
      return updated
    })
  }
  async addLeadActivity(id: string, dto: ActivityDto, user: AuthUser) {
    const lead = await this.db.lead.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'AGENT' ? { assignedToId: user.sub } : {}) } })
    if (!lead) throw new NotFoundException('Lead not found')
    return this.db.leadActivity.create({ data: { leadId: id, actorId: user.sub, ...dto } })
  }
  async createViewing(dto: ViewingDto, user: AuthUser) {
    const property = await this.activeProperty(dto.propertyId)
    if (dto.scheduledAt <= new Date()) throw new BadRequestException('Choose a future viewing time')
    const agent = await this.db.user.findFirst({ where: { organizationId: property.organizationId, role: Role.AGENT }, orderBy: { createdAt: 'asc' } })
    return this.db.viewing.create({ data: { organizationId: property.organizationId, propertyId: property.id, requesterId: user.sub, agentId: agent?.id || property.createdById, scheduledAt: dto.scheduledAt, mode: dto.mode, notes: dto.notes } })
  }
  async listViewings(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { requesterId: user.sub } : { organizationId: user.organizationId, ...(user.role === 'AGENT' ? { agentId: user.sub } : user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }
    return this.db.viewing.findMany({ where, include: { property: true, requester: { select: { id: true, name: true, email: true } } }, orderBy: { scheduledAt: 'asc' }, take: 100 })
  }
  async updateViewing(id: string, status: ViewingStatus, user: AuthUser) {
    const item = await this.db.viewing.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'AGENT' ? { agentId: user.sub } : user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) } })
    if (!item) throw new NotFoundException('Viewing not found')
    const updated = await this.db.viewing.update({ where: { id }, data: { status } })
    await this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action: `viewing.${status.toLowerCase()}`, entity: 'Viewing', entityId: id } })
    return updated
  }
  async cancelViewing(id: string, user: AuthUser) {
    const item = await this.db.viewing.findFirst({ where: { id, requesterId: user.sub, status: { in: [ViewingStatus.REQUESTED, ViewingStatus.CONFIRMED] }, scheduledAt: { gt: new Date() } } })
    if (!item) throw new NotFoundException('Upcoming viewing not found')
    const updated = await this.db.viewing.update({ where: { id }, data: { status: ViewingStatus.CANCELLED } })
    await this.db.auditLog.create({ data: { organizationId: item.organizationId, actorId: user.sub, action: 'viewing.cancelled', entity: 'Viewing', entityId: id } })
    return updated
  }
  async createOffer(dto: OfferDto, user: AuthUser) { const property = await this.activeProperty(dto.propertyId); if (property.purpose !== PropertyPurpose.SALE) throw new BadRequestException('Offers are only available on sale listings'); return this.db.offer.create({ data: { organizationId: property.organizationId, propertyId: property.id, buyerId: user.sub, amount: dto.amount, message: dto.message } }) }
  async listOffers(user: AuthUser) {
    const where = user.role === 'BUYER' || user.role === 'TENANT' ? { buyerId: user.sub } : { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }
    return this.db.offer.findMany({ where, include: { property: true, buyer: { select: { id: true, name: true, email: true } }, counters: { include: { proposer: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 100 })
  }
  async decideOffer(id: string, dto: OfferDecisionDto, user: AuthUser) {
    if (![OfferStatus.COUNTERED, OfferStatus.ACCEPTED, OfferStatus.REJECTED].some((allowed) => allowed === dto.status)) throw new BadRequestException('Choose countered, accepted, or rejected')
    const offer = await this.db.offer.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }, include: { counters: { orderBy: { createdAt: 'desc' }, take: 1 } } })
    if (!offer) throw new NotFoundException('Offer not found in your workspace')
    if (dto.status === OfferStatus.COUNTERED && !dto.amount) throw new BadRequestException('Enter the counter-offer amount')
    const updated = await this.db.$transaction(async (tx) => {
      const latestCounter = offer.counters[0]
      const buyerCounterWaiting = offer.status === OfferStatus.COUNTERED && latestCounter?.proposerId === offer.buyerId
      if (offer.status !== OfferStatus.SUBMITTED && !buyerCounterWaiting) throw new BadRequestException('This offer is waiting for the buyer to respond')
      const updated = await tx.offer.update({ where: { id }, data: { status: dto.status, ...(dto.status === OfferStatus.ACCEPTED && buyerCounterWaiting && latestCounter ? { amount: latestCounter.amount } : {}) } })
      if (dto.status === OfferStatus.COUNTERED) await tx.offerCounter.create({ data: { offerId: id, proposerId: user.sub, amount: dto.amount!, message: dto.message } })
      await this.audit(tx, user, `offer.${dto.status.toLowerCase()}`, 'Offer', id)
      return updated
    })
    return updated
  }
  async respondToOffer(id: string, dto: OfferResponseDto, user: AuthUser) {
    if (![OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.COUNTERED].some((status) => status === dto.status)) throw new BadRequestException('Choose accept, reject, or counter')
    const offer = await this.db.offer.findFirst({ where: { id, buyerId: user.sub, status: OfferStatus.COUNTERED }, include: { counters: { orderBy: { createdAt: 'desc' }, take: 1 } } })
    if (!offer) throw new NotFoundException('Counter-offer not found for your account')
    if (offer.counters[0]?.proposerId === user.sub) throw new BadRequestException('Your counter-offer is waiting for the listing owner')
    if (dto.status === OfferStatus.COUNTERED && !dto.amount) throw new BadRequestException('Enter your counter-offer amount')
    const updated = await this.db.$transaction(async (tx) => {
      const data: Prisma.OfferUpdateManyMutationInput = {
        status: dto.status,
        ...(dto.status === OfferStatus.ACCEPTED && offer.counters[0] ? { amount: offer.counters[0].amount } : {}),
      }
      const result = await tx.offer.updateMany({ where: { id, buyerId: user.sub, status: OfferStatus.COUNTERED }, data })
      if (result.count !== 1) throw new BadRequestException('This offer changed. Refresh and try again.')
      if (dto.status === OfferStatus.COUNTERED) await tx.offerCounter.create({ data: { offerId: id, proposerId: user.sub, amount: dto.amount!, message: dto.message } })
      await this.audit(tx, user, `offer.${dto.status.toLowerCase()}`, 'Offer', id)
      return tx.offer.findUniqueOrThrow({ where: { id } })
    })
    return updated
  }
  async createApplication(dto: ApplicationDto, user: AuthUser) { const property = await this.activeProperty(dto.propertyId); if (property.purpose !== PropertyPurpose.RENT) throw new BadRequestException('Applications are only available on rental listings'); return this.db.rentalApplication.create({ data: { organizationId: property.organizationId, propertyId: property.id, applicantId: user.sub, monthlyIncome: dto.monthlyIncome, employment: dto.employment, message: dto.message } }) }
  async listApplications(user: AuthUser) {
    const where = user.role === 'BUYER' || user.role === 'TENANT' ? { applicantId: user.sub } : { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }
    return this.db.rentalApplication.findMany({ where, include: { property: true, applicant: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 })
  }
  async updateApplication(id: string, status: ApplicationStatus, user: AuthUser) {
    if (![ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED].some((allowed) => allowed === status)) throw new BadRequestException('To approve, create the lease with the application')
    const app = await this.db.rentalApplication.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) } })
    if (!app) throw new NotFoundException('Application not found')
    const updated = await this.db.rentalApplication.update({ where: { id }, data: { status } })
    await this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action: `application.${status.toLowerCase()}`, entity: 'RentalApplication', entityId: id } })
    return updated
  }
  async createLeaseFromApplication(id: string, dto: LeaseDto, user: AuthUser) {
    const application = await this.db.rentalApplication.findFirst({ where: { id, organizationId: user.organizationId, status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING] }, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }, include: { property: true } })
    if (!application) throw new NotFoundException('Open application not found')
    if (dto.endDate <= dto.startDate) throw new BadRequestException('Lease end date must be after its start date')
    const monthCount = (dto.endDate.getFullYear() - dto.startDate.getFullYear()) * 12 + dto.endDate.getMonth() - dto.startDate.getMonth()
    if (monthCount < 1 || monthCount > 36) throw new BadRequestException('Lease terms must be between one month and three years')
    if (dto.unitId) { const unit = await this.db.propertyUnit.findFirst({ where: { id: dto.unitId, propertyId: application.propertyId, organizationId: user.organizationId, status: 'VACANT' } }); if (!unit) throw new BadRequestException('That unit is not available for this property') }
    const ownerId = application.property.createdById
    return this.db.$transaction(async (tx) => {
      const approved = await tx.rentalApplication.updateMany({ where: { id, status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.REVIEWING] } }, data: { status: ApplicationStatus.APPROVED } })
      if (approved.count !== 1) throw new BadRequestException('This application has already been decided')
      if (dto.unitId) {
        const reserved = await tx.propertyUnit.updateMany({ where: { id: dto.unitId, propertyId: application.propertyId, organizationId: user.organizationId, status: 'VACANT' }, data: { status: 'OCCUPIED' } })
        if (reserved.count !== 1) throw new BadRequestException('That unit was just assigned to another lease')
      }
      const lease = await tx.lease.create({ data: { organizationId: user.organizationId, propertyId: application.propertyId, unitId: dto.unitId, tenantId: application.applicantId, ownerId, startDate: dto.startDate, endDate: dto.endDate, monthlyRent: dto.monthlyRent, deposit: dto.deposit || 0, status: 'ACTIVE' } })
      const invoices = Array.from({ length: monthCount }, (_, i) => { const start = new Date(dto.startDate); start.setMonth(start.getMonth() + i); const periodEnd = new Date(start); periodEnd.setMonth(periodEnd.getMonth() + 1); const dueDate = new Date(start); return { leaseId: lease.id, periodStart: start, periodEnd, dueDate, amount: dto.monthlyRent, status: dueDate < new Date() ? InvoiceStatus.DUE : InvoiceStatus.UPCOMING } })
      await tx.rentInvoice.createMany({ data: invoices })
      await this.audit(tx, user, 'lease.created', 'Lease', lease.id)
      return lease
    })
  }
  async listUnits(user: AuthUser) { return this.db.propertyUnit.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }, include: { property: true }, orderBy: [{ propertyId: 'asc' }, { unitNumber: 'asc' }] }) }
  async listPortfolioProperties(user: AuthUser) { return this.db.property.findMany({ where: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { createdById: user.sub } : {}) }, include: { units: true }, orderBy: { createdAt: 'desc' } }) }
  async createUnit(dto: UnitDto, user: AuthUser) {
    const property = await this.db.property.findFirst({ where: { id: dto.propertyId, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { createdById: user.sub } : {}) } })
    if (!property) throw new NotFoundException('Property not found in your portfolio')
    return this.db.propertyUnit.create({ data: { organizationId: user.organizationId, ...dto } })
  }
  async listLeases(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { tenantId: user.sub } : user.role === 'OWNER' ? { organizationId: user.organizationId, ownerId: user.sub } : { organizationId: user.organizationId }
    return this.db.lease.findMany({ where, include: { property: true, unit: true, tenant: { select: { id: true, name: true, email: true } }, owner: { select: { id: true, name: true, email: true } }, invoices: { orderBy: { dueDate: 'asc' } } }, orderBy: { endDate: 'asc' } })
  }
  async listInvoices(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { lease: { tenantId: user.sub } } : user.role === 'OWNER' ? { lease: { organizationId: user.organizationId, ownerId: user.sub } } : { lease: { organizationId: user.organizationId } }
    const now = new Date()
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    await this.db.rentInvoice.updateMany({ where: { ...where, status: InvoiceStatus.UPCOMING, dueDate: { lte: now } }, data: { status: InvoiceStatus.DUE } })
    await this.db.rentInvoice.updateMany({ where: { ...where, status: InvoiceStatus.DUE, dueDate: { lt: today } }, data: { status: InvoiceStatus.OVERDUE } })
    return this.db.rentInvoice.findMany({ where, include: { lease: { include: { property: true, tenant: { select: { id: true, name: true, email: true } } } }, payments: true }, orderBy: { dueDate: 'asc' }, take: 200 })
  }
  async recordInvoicePayment(id: string, dto: PaymentDto, user: AuthUser) {
    if (dto.method === PaymentMethod.CARD) throw new BadRequestException('Card payments must be confirmed through hosted checkout')
    const invoice = await this.db.rentInvoice.findFirst({ where: { id, lease: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) }, status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] } }, include: { lease: { select: { tenantId: true } } } })
    if (!invoice) throw new NotFoundException('Open rent invoice not found for your account')
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000)
    await this.db.paymentCheckout.updateMany({ where: { invoiceId: id, payerId: invoice.lease.tenantId, status: PaymentCheckoutStatus.PENDING, createdAt: { lt: expiredAt } }, data: { status: PaymentCheckoutStatus.FAILED } })
    const pendingCheckout = await this.db.paymentCheckout.findFirst({ where: { invoiceId: id, payerId: invoice.lease.tenantId, status: PaymentCheckoutStatus.PENDING } })
    if (pendingCheckout) throw new ConflictException('Finish or cancel the active online checkout before recording another payment')
    const remaining = Number(invoice.amount) - Number(invoice.amountPaid)
    if (dto.amount > remaining) throw new BadRequestException(`Payment exceeds the remaining balance of PKR ${remaining.toLocaleString()}`)
    return this.db.$transaction(async (tx) => {
      const amountPaid = Number(invoice.amountPaid) + dto.amount
      const update = await tx.rentInvoice.updateMany({ where: { id, amountPaid: invoice.amountPaid }, data: { amountPaid: { increment: dto.amount }, status: amountPaid >= Number(invoice.amount) ? InvoiceStatus.PAID : invoice.dueDate < new Date(new Date().setHours(0, 0, 0, 0)) ? InvoiceStatus.OVERDUE : InvoiceStatus.PARTIAL } })
      if (update.count !== 1) throw new BadRequestException('This balance changed while you were paying. Refresh and try again.')
      const payment = await tx.payment.create({ data: { invoiceId: id, payerId: invoice.lease.tenantId, amount: dto.amount, method: dto.method, reference: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}` } })
      await this.audit(tx, user, 'rent_payment.recorded', 'Payment', payment.id)
      return payment
    })
  }
  async listMaintenance(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { requesterId: user.sub } : user.role === 'VENDOR' ? { organizationId: user.organizationId, vendor: { userId: user.sub } } : { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) }
    return this.db.maintenanceRequest.findMany({ where, include: { property: true, requester: { select: { id: true, name: true, email: true } }, vendor: true }, orderBy: { updatedAt: 'desc' }, take: 100 })
  }
  async createMaintenance(dto: MaintenanceDto, user: AuthUser) {
    const property = await this.activeProperty(dto.propertyId)
    if (user.role === 'TENANT' || user.role === 'BUYER') {
      const lease = await this.db.lease.findFirst({ where: { tenantId: user.sub, propertyId: property.id, status: 'ACTIVE' } })
      if (!lease) throw new ForbiddenException('Maintenance requests are available for properties on your active lease')
    } else if (user.role === 'OWNER' && (property.createdById !== user.sub || property.organizationId !== user.organizationId)) throw new ForbiddenException('You can only report maintenance for your own properties')
    else if (['ADMIN', 'AGENT'].includes(user.role) && property.organizationId !== user.organizationId) throw new ForbiddenException('Choose a property in your organization')
    const priority = dto.priority || Priority.MEDIUM
    const slaHours = priority === Priority.URGENT ? 4 : priority === Priority.HIGH ? 24 : priority === Priority.MEDIUM ? 72 : 168
    return this.db.maintenanceRequest.create({ data: { organizationId: property.organizationId, propertyId: property.id, requesterId: user.sub, title: dto.title, description: dto.description, category: dto.category, priority, slaDueAt: new Date(Date.now() + slaHours * 3600000) } })
  }
  async createVendor(dto: VendorDto, user: AuthUser) {
    const membership = dto.email ? await this.db.organizationMembership.findFirst({ where: { organizationId: user.organizationId, role: Role.VENDOR, user: { email: dto.email.toLowerCase() } } }) : null
    return this.db.vendor.create({ data: { organizationId: user.organizationId, ...dto, email: dto.email?.toLowerCase(), userId: membership?.userId } })
  }
  async listVendors(user: AuthUser) { return this.db.vendor.findMany({ where: { organizationId: user.organizationId, active: true }, orderBy: { name: 'asc' } }) }
  async assignVendor(id: string, dto: AssignVendorDto, user: AuthUser) {
    const ticket = await this.db.maintenanceRequest.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : {}) } })
    if (!ticket) throw new NotFoundException('Maintenance request not found')
    const vendor = await this.db.vendor.findFirst({ where: { id: dto.vendorId, organizationId: user.organizationId, active: true } })
    if (!vendor) throw new NotFoundException('Vendor not found in your organization')
    const updated = await this.db.maintenanceRequest.update({ where: { id }, data: { vendorId: vendor.id, quotedCost: dto.quotedCost, status: MaintenanceStatus.ASSIGNED } })
    await this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action: 'maintenance.vendor_assigned', entity: 'MaintenanceRequest', entityId: id } })
    return updated
  }
  async updateMaintenance(id: string, status: MaintenanceStatus, user: AuthUser) {
    const ticket = await this.db.maintenanceRequest.findFirst({ where: { id, organizationId: user.organizationId, ...(user.role === 'OWNER' ? { property: { createdById: user.sub } } : user.role === 'VENDOR' ? { vendor: { userId: user.sub } } : {}) } })
    if (!ticket) throw new NotFoundException('Maintenance request not found')
    if (user.role === 'VENDOR' && !({ ASSIGNED: [MaintenanceStatus.SCHEDULED], SCHEDULED: [MaintenanceStatus.IN_PROGRESS], IN_PROGRESS: [MaintenanceStatus.COMPLETED] } as Record<string, MaintenanceStatus[]>)[ticket.status]?.includes(status)) throw new BadRequestException('Move the assigned job to its next work status')
    const updated = await this.db.maintenanceRequest.update({ where: { id }, data: { status } })
    await this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action: `maintenance.${status.toLowerCase()}`, entity: 'MaintenanceRequest', entityId: id } })
    return updated
  }
  async endLease(id: string, user: AuthUser) {
    const lease = await this.db.lease.findFirst({ where: { id, organizationId: user.organizationId, status: LeaseStatus.ACTIVE, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) } })
    if (!lease) throw new NotFoundException('Active lease not found in your workspace')
    return this.db.$transaction(async (tx) => {
      const result = await tx.lease.updateMany({ where: { id, status: LeaseStatus.ACTIVE }, data: { status: LeaseStatus.TERMINATED } })
      if (result.count !== 1) throw new BadRequestException('This lease has already changed')
      if (lease.unitId) await tx.propertyUnit.update({ where: { id: lease.unitId }, data: { status: 'VACANT' } })
      await tx.rentInvoice.updateMany({ where: { leaseId: id, status: InvoiceStatus.UPCOMING }, data: { status: InvoiceStatus.CANCELLED } })
      await this.audit(tx, user, 'lease.terminated', 'Lease', id)
      return tx.lease.findUniqueOrThrow({ where: { id } })
    })
  }
  async listPayments(user: AuthUser) {
    const where = ['BUYER', 'TENANT'].includes(user.role) ? { payerId: user.sub } : { invoice: { lease: { organizationId: user.organizationId, ...(user.role === 'OWNER' ? { ownerId: user.sub } : {}) } } }
    return this.db.payment.findMany({ where, include: { invoice: { include: { lease: { include: { property: true } } } } }, orderBy: { paidAt: 'desc' }, take: 200 })
  }
}

@ApiTags('workflows') @ApiBearerAuth() @UseGuards(AuthGuard)
@Controller()
class WorkflowsController {
  constructor(private service: WorkflowsService) {}
  @Get('workspace/overview') overview(@CurrentUser() user: AuthUser) { return this.service.overview(user) }
  @Get('workspace/statement') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') ownerStatement(@CurrentUser() user: AuthUser) { return this.service.ownerStatement(user) }
  @Get('saved-searches') savedSearches(@CurrentUser() user: AuthUser) { return this.service.savedSearches(user) }
  @Post('saved-searches') createSavedSearch(@Body() dto: SavedSearchDto, @CurrentUser() user: AuthUser) { return this.service.createSavedSearch(dto, user) }
  @Post('saved-searches/:id/delete') deleteSavedSearch(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.deleteSavedSearch(id, user) }
  @Patch('saved-searches/:id/alerts') setSavedSearchAlerts(@Param('id') id: string, @Body() dto: SavedSearchAlertDto, @CurrentUser() user: AuthUser) { return this.service.setSavedSearchAlerts(id, dto.enabled, user) }
  @Get('tasks') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT') tasks(@CurrentUser() user: AuthUser) { return this.service.tasks(user) }
  @Post('tasks') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT') createTask(@Body() dto: TaskDto, @CurrentUser() user: AuthUser) { return this.service.createTask(dto, user) }
  @Patch('tasks/:id/complete') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT') completeTask(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.completeTask(id, user) }
  @Post('inquiries') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER', 'TENANT') createInquiry(@Body() dto: InquiryDto, @CurrentUser() user: AuthUser) { return this.service.createInquiry(dto, user) }
  @Get('inquiries') inquiries(@CurrentUser() user: AuthUser) { return this.service.listInquiries(user) }
  @Post('inquiries/:id/messages') sendInquiryMessage(@Param('id') id: string, @Body() dto: InquiryMessageDto, @CurrentUser() user: AuthUser) { return this.service.sendInquiryMessage(id, dto, user) }
  @Get('leads') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT', 'SALES_MANAGER') leads(@CurrentUser() user: AuthUser) { return this.service.listLeads(user) }
  @Get('sales/team') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'SALES_MANAGER') salesTeam(@CurrentUser() user: AuthUser) { return this.service.salesTeam(user) }
  @Patch('leads/:id/stage') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT') updateLead(@Param('id') id: string, @Body() dto: StageDto, @CurrentUser() user: AuthUser) { return this.service.updateLead(id, dto, user) }
  @Post('leads/:id/activities') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'AGENT') addActivity(@Param('id') id: string, @Body() dto: ActivityDto, @CurrentUser() user: AuthUser) { return this.service.addLeadActivity(id, dto, user) }
  @Get('viewings') viewings(@CurrentUser() user: AuthUser) { return this.service.listViewings(user) }
  @Post('viewings') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER', 'TENANT') createViewing(@Body() dto: ViewingDto, @CurrentUser() user: AuthUser) { return this.service.createViewing(dto, user) }
  @Patch('viewings/:id/status') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') updateViewing(@Param('id') id: string, @Body('status', new ParseEnumPipe(ViewingStatus)) status: ViewingStatus, @CurrentUser() user: AuthUser) { return this.service.updateViewing(id, status, user) }
  @Post('viewings/:id/cancel') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER', 'TENANT') cancelViewing(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.cancelViewing(id, user) }
  @Get('offers') offers(@CurrentUser() user: AuthUser) { return this.service.listOffers(user) }
  @Post('offers') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER') createOffer(@Body() dto: OfferDto, @CurrentUser() user: AuthUser) { return this.service.createOffer(dto, user) }
  @Patch('offers/:id/status') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') decideOffer(@Param('id') id: string, @Body() dto: OfferDecisionDto, @CurrentUser() user: AuthUser) { return this.service.decideOffer(id, dto, user) }
  @Post('offers/:id/respond') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER') respondToOffer(@Param('id') id: string, @Body() dto: OfferResponseDto, @CurrentUser() user: AuthUser) { return this.service.respondToOffer(id, dto, user) }
  @Get('applications') applications(@CurrentUser() user: AuthUser) { return this.service.listApplications(user) }
  @Post('applications') @UseGuards(AuthGuard, RolesGuard) @Roles('BUYER', 'TENANT') createApplication(@Body() dto: ApplicationDto, @CurrentUser() user: AuthUser) { return this.service.createApplication(dto, user) }
  @Patch('applications/:id/status') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') updateApplication(@Param('id') id: string, @Body('status', new ParseEnumPipe(ApplicationStatus)) status: ApplicationStatus, @CurrentUser() user: AuthUser) { return this.service.updateApplication(id, status, user) }
  @Post('applications/:id/lease') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') createLease(@Param('id') id: string, @Body() dto: LeaseDto, @CurrentUser() user: AuthUser) { return this.service.createLeaseFromApplication(id, dto, user) }
  @Get('units') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') units(@CurrentUser() user: AuthUser) { return this.service.listUnits(user) }
  @Get('portfolio/properties') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') portfolioProperties(@CurrentUser() user: AuthUser) { return this.service.listPortfolioProperties(user) }
  @Post('units') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') createUnit(@Body() dto: UnitDto, @CurrentUser() user: AuthUser) { return this.service.createUnit(dto, user) }
  @Get('leases') leases(@CurrentUser() user: AuthUser) { return this.service.listLeases(user) }
  @Post('leases/:id/terminate') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') endLease(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.endLease(id, user) }
  @Get('rent-invoices') rentInvoices(@CurrentUser() user: AuthUser) { return this.service.listInvoices(user) }
  @Get('payments') payments(@CurrentUser() user: AuthUser) { return this.service.listPayments(user) }
  @Post('rent-invoices/:id/payments') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') recordPayment(@Param('id') id: string, @Body() dto: PaymentDto, @CurrentUser() user: AuthUser) { return this.service.recordInvoicePayment(id, dto, user) }
  @Get('maintenance') maintenance(@CurrentUser() user: AuthUser) { return this.service.listMaintenance(user) }
  @Post('maintenance') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'TENANT', 'BUYER') createMaintenance(@Body() dto: MaintenanceDto, @CurrentUser() user: AuthUser) { return this.service.createMaintenance(dto, user) }
  @Get('vendors') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') vendors(@CurrentUser() user: AuthUser) { return this.service.listVendors(user) }
  @Post('vendors') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER') createVendor(@Body() dto: VendorDto, @CurrentUser() user: AuthUser) { return this.service.createVendor(dto, user) }
  @Patch('maintenance/:id/assign-vendor') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT') assignVendor(@Param('id') id: string, @Body() dto: AssignVendorDto, @CurrentUser() user: AuthUser) { return this.service.assignVendor(id, dto, user) }
  @Patch('maintenance/:id/status') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN', 'OWNER', 'AGENT', 'VENDOR') updateMaintenance(@Param('id') id: string, @Body('status', new ParseEnumPipe(MaintenanceStatus)) status: MaintenanceStatus, @CurrentUser() user: AuthUser) { return this.service.updateMaintenance(id, status, user) }
}

@Module({ imports: [AuthModule, CommunicationsModule], controllers: [WorkflowsController], providers: [WorkflowsService] })
export class WorkflowsModule {}
