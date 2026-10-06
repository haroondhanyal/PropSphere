import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'
import { Role } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { PrismaService } from './prisma.service'
import { AuthGuard, AuthUser, CurrentUser, Roles, RolesGuard } from './access'
import { AuthModule } from './auth.module'

class RoleDto { @IsEnum(Role) role!: Role }
class MemberDto { @IsEmail() email!: string; @IsEnum(Role) role!: Role }
class RiskDto { @IsString() @MaxLength(100) category!: string; @IsString() @MaxLength(1000) description!: string; @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) severity?: string; @IsOptional() @IsString() entityType?: string; @IsOptional() @IsString() entityId?: string }
class SettingDto { @IsObject() value!: Record<string, unknown> }

@Injectable()
class AdminService {
  constructor(private db: PrismaService) {}
  private async audit(user: AuthUser, action: string, entity: string, entityId?: string, details?: object) { return this.db.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.sub, action, entity, entityId, details } }) }
  users(user: AuthUser) { return this.db.organizationMembership.findMany({ where: { organizationId: user.organizationId }, include: { user: { select: { id: true, name: true, email: true, createdAt: true } } }, orderBy: { createdAt: 'asc' } }).then((memberships) => memberships.map(({ id, role, createdAt, user: person }) => ({ membershipId: id, role, joinedAt: createdAt, ...person }))) }
  async updateRole(id: string, role: Role, user: AuthUser) {
    if (id === user.sub) throw new ForbiddenException('You cannot change your own role')
    const target = await this.db.organizationMembership.findUnique({ where: { userId_organizationId: { userId: id, organizationId: user.organizationId } } })
    if (!target) throw new NotFoundException('Organization member not found')
    if (target.role === Role.ADMIN && role !== Role.ADMIN && await this.db.organizationMembership.count({ where: { organizationId: user.organizationId, role: Role.ADMIN } }) <= 1) throw new ConflictException('Keep at least one administrator in the organization')
    const result = await this.db.organizationMembership.updateMany({ where: { userId: id, organizationId: user.organizationId }, data: { role } })
    if (!result.count) throw new NotFoundException('Organization member not found')
    await this.audit(user, 'user.role_changed', 'User', id, { role })
    return { userId: id, role }
  }
  async addMember(email: string, role: Role, user: AuthUser) {
    const person = await this.db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!person) throw new NotFoundException('Create this PropSphere account before adding it to the organization')
    const exists = await this.db.organizationMembership.findUnique({ where: { userId_organizationId: { userId: person.id, organizationId: user.organizationId } } })
    if (exists) throw new ConflictException('This account is already a member of your organization')
    const membership = await this.db.organizationMembership.create({ data: { userId: person.id, organizationId: user.organizationId, role } })
    await this.audit(user, 'user.added_to_organization', 'User', person.id, { role })
    return { userId: person.id, role: membership.role }
  }
  auditLogs(user: AuthUser) { return this.db.auditLog.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: 'desc' }, take: 250 }) }
  risks(user: AuthUser) { return this.db.riskFlag.findMany({ where: { organizationId: user.organizationId }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200 }) }
  async createRisk(dto: RiskDto, user: AuthUser) { const flag = await this.db.riskFlag.create({ data: { ...dto, organizationId: user.organizationId, createdById: user.sub, severity: dto.severity || 'MEDIUM' } }); await this.audit(user, 'risk_flag.created', 'RiskFlag', flag.id); return flag }
  async resolveRisk(id: string, user: AuthUser) { const flag = await this.db.riskFlag.findFirst({ where: { id, organizationId: user.organizationId, status: 'OPEN' } }); if (!flag) throw new NotFoundException('Open risk flag not found'); const updated = await this.db.riskFlag.update({ where: { id }, data: { status: 'RESOLVED', resolvedById: user.sub, resolvedAt: new Date() } }); await this.audit(user, 'risk_flag.resolved', 'RiskFlag', id); return updated }
  settings(user: AuthUser) { return this.db.organizationSetting.findMany({ where: { organizationId: user.organizationId }, orderBy: { key: 'asc' } }) }
  async updateSetting(key: string, value: Record<string, unknown>, user: AuthUser) { if (!/^[a-z][a-zA-Z0-9_-]{0,63}$/.test(key)) throw new BadRequestException('Setting keys must use lowercase letters, numbers, dashes, or underscores'); const json = value as Prisma.InputJsonValue; const setting = await this.db.organizationSetting.upsert({ where: { organizationId_key: { organizationId: user.organizationId, key } }, update: { value: json }, create: { organizationId: user.organizationId, key, value: json } }); await this.audit(user, 'setting.updated', 'OrganizationSetting', setting.id, { key }); return setting }
}

@ApiTags('administration') @ApiBearerAuth() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN')
@Controller('admin')
class AdminController {
  constructor(private service: AdminService) {}
  @Get('users') users(@CurrentUser() user: AuthUser) { return this.service.users(user) }
  @Post('users') addMember(@Body() dto: MemberDto, @CurrentUser() user: AuthUser) { return this.service.addMember(dto.email, dto.role, user) }
  @Patch('users/:id/role') updateRole(@Param('id') id: string, @Body() dto: RoleDto, @CurrentUser() user: AuthUser) { return this.service.updateRole(id, dto.role, user) }
  @Get('audit') audit(@CurrentUser() user: AuthUser) { return this.service.auditLogs(user) }
  @Get('risks') risks(@CurrentUser() user: AuthUser) { return this.service.risks(user) }
  @Post('risks') createRisk(@Body() dto: RiskDto, @CurrentUser() user: AuthUser) { return this.service.createRisk(dto, user) }
  @Patch('risks/:id/resolve') resolveRisk(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.resolveRisk(id, user) }
  @Get('settings') settings(@CurrentUser() user: AuthUser) { return this.service.settings(user) }
  @Patch('settings/:key') setting(@Param('key') key: string, @Body() dto: SettingDto, @CurrentUser() user: AuthUser) { return this.service.updateSetting(key, dto.value, user) }
}

@Module({ imports: [AuthModule], controllers: [AdminController], providers: [AdminService, AuthGuard, RolesGuard] })
export class AdminModule {}
