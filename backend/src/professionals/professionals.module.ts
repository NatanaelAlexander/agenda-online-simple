import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { InternalProfessionalsController } from './professionals.controller.js';
import { ProfessionalsService } from './professionals.service.js';

@Module({
  imports: [AuditModule],
  controllers: [InternalProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
