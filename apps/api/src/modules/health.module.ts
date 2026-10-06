import { Controller, Get, Injectable, Module, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Injectable()
class HealthService {
  constructor(private db: PrismaService) {}
  async check() {
    try { await this.db.$queryRaw`SELECT 1`; return { status: 'ok', database: 'connected' } }
    catch { throw new ServiceUnavailableException({ status: 'unavailable', database: 'disconnected' }) }
  }
}

@Controller('health')
class HealthController {
  constructor(private service: HealthService) {}
  @Get() check() { return this.service.check() }
}

@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
