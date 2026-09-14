import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { InternalBusinessesController } from './businesses.controller.js';
import { BusinessesService } from './businesses.service.js';
import { PortalBusinessesController } from './portal-businesses.controller.js';

@Module({
  imports: [AuditModule, AssetsModule],
  controllers: [InternalBusinessesController, PortalBusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
