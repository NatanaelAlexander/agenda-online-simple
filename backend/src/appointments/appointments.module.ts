import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module.js';
import { AvailabilityModule } from '../availability/availability.module.js';
import { MailModule } from '../common/mail/mail.module.js';
import { AppointmentsReminderJob } from './appointments-reminder.job.js';
import {
  InternalAppointmentsController,
  PortalAppointmentsController,
} from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AvailabilityModule,
    AuthModule,
    MailModule,
  ],
  controllers: [
    InternalAppointmentsController,
    PortalAppointmentsController,
  ],
  providers: [AppointmentsService, AppointmentsReminderJob],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
