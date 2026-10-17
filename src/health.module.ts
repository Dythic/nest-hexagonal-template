import { HealthController } from '@infrastructure/inbound/api/health.controller.js';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule.forRoot({ logger: false })],
  controllers: [HealthController],
})
export class HealthModule {}
