import { Module } from '@nestjs/common';
import { InternalAuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

@Module({
  controllers: [InternalAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
