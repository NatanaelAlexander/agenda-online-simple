import { Module } from '@nestjs/common';
import { InternalUsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [InternalUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
