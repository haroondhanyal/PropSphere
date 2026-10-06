import { Body, ConflictException, Controller, Get, Injectable, Module, Patch, Post, UnauthorizedException, UseGuards, ForbiddenException } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import * as bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { PrismaService } from './prisma.service'
import { AuthGuard, AuthUser, CurrentUser } from './access'
import { CommunicationsModule, EmailService } from './communications.module'
import { Role } from '@prisma/client'

class LoginDto {
  @IsEmail() email!: string
  @IsString() @MinLength(8) password!: string
  @IsOptional() @IsBoolean() rememberMe?: boolean
}
class SignupDto { @IsString() @MaxLength(100) name!: string; @IsEmail() email!: string; @IsString() @MaxLength(120) organizationName!: string; @IsString() @MinLength(10) password!: string; @IsOptional() @IsIn(['BUYER', 'TENANT', 'OWNER']) accountType?: string }
class ProfileDto { @IsString() @MaxLength(100) name!: string; @IsOptional() @IsString() @MaxLength(40) phone?: string; @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string; @IsOptional() @IsIn(['BUYER', 'TENANT', 'OWNER']) accountType?: string }
class ForgotPasswordDto { @IsEmail() email!: string }
class ResetPasswordDto { @IsString() token!: string; @IsString() @MinLength(10) password!: string }

@Injectable()
class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService, private email: EmailService) {}
  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase()
    if (await this.db.user.findUnique({ where: { email }, select: { id: true } })) throw new ConflictException('An account with this email already exists')
    const passwordHash = await bcrypt.hash(dto.password, 12)
    const baseSlug = dto.organizationName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 45) || 'workspace'
    const result = await this.db.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: dto.organizationName.trim(), slug: `${baseSlug}-${randomBytes(3).toString('hex')}` } })
      const user = await tx.user.create({ data: { organizationId: organization.id, name: dto.name.trim(), email, passwordHash, role: Role.ADMIN, accountType: dto.accountType || 'OWNER' } })
      await tx.organizationMembership.create({ data: { userId: user.id, organizationId: organization.id, role: Role.ADMIN } })
      return { organization, user }
    })
    return this.createSession(result.user, { organizationId: result.organization.id, role: Role.ADMIN, organization: result.organization }, [{ organizationId: result.organization.id, role: Role.ADMIN, organization: result.organization }])
  }
  async login(email: string, password: string, rememberMe = false) {
    const user = await this.db.user.findUnique({ where: { email }, include: { memberships: { include: { organization: true }, orderBy: { createdAt: 'asc' } } } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Email or password is incorrect')
    const membership = user.memberships.find((item) => item.organizationId === user.organizationId) || user.memberships[0]
    if (!membership) throw new ForbiddenException('Your account is not connected to an organization')
    return this.createSession(user, membership, user.memberships, rememberMe ? '30d' : '8h')
  }
  async switchOrganization(userId: string, organizationId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, include: { memberships: { include: { organization: true } } } })
    const membership = user?.memberships.find((item) => item.organizationId === organizationId)
    if (!user || !membership) throw new ForbiddenException('You are not a member of that organization')
    return this.createSession(user, membership, user.memberships)
  }
  async updateProfile(userId: string, dto: ProfileDto) {
    const user = await this.db.user.update({ where: { id: userId }, data: { name: dto.name.trim(), phone: dto.phone?.trim() || null, avatarUrl: dto.avatarUrl || null, ...(dto.accountType ? { accountType: dto.accountType } : {}) }, select: { id: true, name: true, email: true, accountType: true, phone: true, avatarUrl: true } })
    return user
  }
  getProfile(userId: string) { return this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, accountType: true, phone: true, avatarUrl: true } }) }
  async requestPasswordReset(email: string) {
    const user = await this.db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, name: true, email: true } })
    if (!user || !this.email.ready) return { message: 'If an account exists and email delivery is configured, a reset link will be sent.' }
    const token = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await this.db.$transaction([
      this.db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
      this.db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
    ])
    const resetUrl = `${process.env.WEB_URL || 'http://127.0.0.1:5174'}/reset-password?token=${encodeURIComponent(token)}`
    await this.email.send(user.email, 'Reset your PropSphere password', `Hi ${user.name}, use this link within one hour to reset your password: ${resetUrl}`, `<p>Hi ${escapeHtml(user.name)},</p><p><a href="${escapeHtml(resetUrl)}">Reset your PropSphere password</a>. This link expires in one hour.</p>`)
    return { message: 'If an account exists and email delivery is configured, a reset link will be sent.' }
  }
  async resetPassword(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const reset = await this.db.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, userId: true } })
    if (!reset) throw new UnauthorizedException('This password reset link is invalid or has expired')
    const passwordHash = await bcrypt.hash(password, 12)
    await this.db.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: reset.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })
      if (!claimed.count) throw new UnauthorizedException('This password reset link has already been used')
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } })
      await tx.passwordResetToken.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: new Date() } })
    })
    return { message: 'Password updated. You can now sign in.' }
  }
  private async createSession(user: { id: string; name: string; email: string }, membership: { organizationId: string; role: string; organization: { name: string } }, memberships: { organizationId: string; role: string; organization: { name: string } }[], expiresIn = '8h') {
    const token = await this.jwt.signAsync({ sub: user.id, organizationId: membership.organizationId, role: membership.role, email: user.email }, { expiresIn })
    return { token, user: { id: user.id, name: user.name, email: user.email, role: membership.role, organizationId: membership.organizationId, organizationName: membership.organization.name, organizations: memberships.map((item) => ({ id: item.organizationId, name: item.organization.name, role: item.role })) } }
  }
}

class SwitchOrganizationDto { @IsString() organizationId!: string }

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.email.toLowerCase(), dto.password, dto.rememberMe) }
  @Post('signup') signup(@Body() dto: SignupDto) { return this.auth.signup(dto) }
  @Post('forgot-password') forgotPassword(@Body() dto: ForgotPasswordDto) { return this.auth.requestPasswordReset(dto.email) }
  @Post('reset-password') resetPassword(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto.token, dto.password) }
  @Post('switch-organization') @UseGuards(AuthGuard) switchOrganization(@CurrentUser() user: AuthUser, @Body() dto: SwitchOrganizationDto) { return this.auth.switchOrganization(user.sub, dto.organizationId) }
  @Patch('profile') @UseGuards(AuthGuard) updateProfile(@CurrentUser() user: AuthUser, @Body() dto: ProfileDto) { return this.auth.updateProfile(user.sub, dto) }
  @Get('profile') @UseGuards(AuthGuard) getProfile(@CurrentUser() user: AuthUser) { return this.auth.getProfile(user.sub) }
}

@Module({ imports: [CommunicationsModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'local-only-change-this-secret-string-12345', signOptions: { expiresIn: '8h' } })], controllers: [AuthController], providers: [AuthService, AuthGuard], exports: [JwtModule] })
export class AuthModule {}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!) }
