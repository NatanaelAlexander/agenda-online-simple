import { Module } from '@nestjs/common';
import { InternalClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';

@Module({
  controllers: [InternalClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
