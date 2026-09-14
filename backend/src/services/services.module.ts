import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { InternalServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  imports: [AuditModule],
  controllers: [InternalServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
