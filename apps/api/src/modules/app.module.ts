import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './auth.module'
import { CommunicationsModule } from './communications.module'
import { PaymentsModule } from './payments.module'
import { PropertiesModule } from './properties.module'
import { PrismaModule } from './prisma.module'
import { WorkflowsModule } from './workflows.module'
import { PhaseFourModule } from './phase-four.module'
import { AdminModule } from './admin.module'
import { HealthModule } from './health.module'

@Module({ imports: [PrismaModule, ScheduleModule.forRoot(), CommunicationsModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'local-only-change-this-secret-string-12345' }), AuthModule, PropertiesModule, WorkflowsModule, PaymentsModule, PhaseFourModule, AdminModule, HealthModule] })
export class AppModule {}
