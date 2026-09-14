import { Module } from '@nestjs/common';
import {
  InternalSystemBrandingController,
  PortalSystemController,
} from './system.controller.js';
import { SystemBrandingService } from './system-branding.service.js';

@Module({
  controllers: [InternalSystemBrandingController, PortalSystemController],
  providers: [SystemBrandingService],
  exports: [SystemBrandingService],
})
export class SystemModule {}
