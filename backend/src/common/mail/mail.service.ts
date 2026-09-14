import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import {
  isMailConfigured,
  loadMailConfig,
  type MailConfig,
} from './mail.config.js';
import type { SendMailInput, SendMailResult } from './mail.types.js';

/**
 * Cliente Resend vía HTTP (sin SDK npm) — mismo contrato que edificio-alcazar.
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private config: MailConfig = loadMailConfig();

  onModuleInit(): void {
    this.config = loadMailConfig();
    if (!isMailConfigured(this.config)) {
      this.logger.warn(
        'Resend no configurado: faltan RESEND_API_KEY o RESEND_FROM_EMAIL (ver .env.example)',
      );
      return;
    }
    this.logger.log(`Resend listo (from=${this.config.fromEmail})`);
  }

  isConfigured(): boolean {
    this.config = loadMailConfig();
    return isMailConfigured(this.config);
  }

  getAppPublicUrl(): string {
    return loadMailConfig().appPublicUrl;
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    this.config = loadMailConfig();

    if (!this.isConfigured()) {
      this.logger.warn(
        `Email omitido (Resend no configurado): "${input.subject}" → ${String(input.to)}`,
      );
      return { id: null, skipped: true };
    }

    const from = `${this.config.fromName} <${this.config.fromEmail}>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      const mensaje =
        body.message || body.name || `Resend HTTP ${response.status}`;
      this.logger.error(`Resend error: ${mensaje}`);
      throw new Error(mensaje);
    }

    return { id: body.id ?? null, skipped: false };
  }
}
