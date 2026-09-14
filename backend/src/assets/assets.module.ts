import { Module } from '@nestjs/common';
import { StorageModule } from '../common/storage/storage.module.js';
import { InternalAssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({
  imports: [StorageModule],
  controllers: [InternalAssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
