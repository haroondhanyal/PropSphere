import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException, createParamDecorator } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { PrismaService } from './prisma.service'

export interface AuthUser { sub: string; organizationId: string; role: string; email: string }
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest().user as AuthUser)
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private db: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>()
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Sign in to continue')
    try {
      const claims = await this.jwt.verifyAsync<AuthUser>(header.slice(7))
      const membership = await this.db.organizationMembership.findUnique({ where: { userId_organizationId: { userId: claims.sub, organizationId: claims.organizationId } }, select: { role: true } })
      if (!membership) throw new UnauthorizedException('Your organization membership is no longer active')
      request.user = { ...claims, role: membership.role }
      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException('Your session has expired. Sign in again.')
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()])
    if (!roles?.length) return true
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user
    if (!user) throw new UnauthorizedException()
    if (!roles.includes(user.role)) throw new ForbiddenException('You do not have permission to do that')
    return true
  }
}
