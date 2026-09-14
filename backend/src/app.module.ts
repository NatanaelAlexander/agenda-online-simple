import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ApiAuthorizationGuard } from './auth/guards/api-authorization.guard.js';
import { AvailabilityModule } from './availability/availability.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { DatabaseModule } from './common/database/database.module.js';
import { MailModule } from './common/mail/mail.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { loadSecurityConfig } from './common/security/security.config.js';
import { StorageModule } from './common/storage/storage.module.js';
import { ProfessionalsModule } from './professionals/professionals.module.js';
import { ServicesModule } from './services/services.module.js';
import { SystemModule } from './system/system.module.js';
import { UsersModule } from './users/users.module.js';

const security = loadSecurityConfig();

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: security.throttleTtlMs,
          limit: security.throttleLimit,
        },
      ],
    }),
    DatabaseModule,
    RedisModule,
    MailModule,
    StorageModule,
    AuthModule,
    AuditModule,
    AssetsModule,
    BusinessesModule,
    ServicesModule,
    ProfessionalsModule,
    ClientsModule,
    AvailabilityModule,
    AppointmentsModule,
    SystemModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiAuthorizationGuard,
    },
  ],
})
export class AppModule {}
