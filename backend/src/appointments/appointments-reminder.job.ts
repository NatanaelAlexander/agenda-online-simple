import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from './appointments.service.js';

@Injectable()
export class AppointmentsReminderJob {
  private readonly logger = new Logger(AppointmentsReminderJob.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Busca citas confirmadas ~24h adelante y envía recordatorio. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders(): Promise<void> {
    try {
      const sent = await this.appointmentsService.sendDueReminders();
      if (sent > 0) {
        this.logger.log(`Recordatorios enviados: ${sent}`);
      }
    } catch (error) {
      this.logger.error(
        'Error en job de recordatorios de citas',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
