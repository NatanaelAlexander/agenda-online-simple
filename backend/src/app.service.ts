import { Injectable } from '@nestjs/common';
import pg from 'pg';

@Injectable()
export class AppService {
  getHello(): { service: string; status: string } {
    return { service: 'agenda-online-simple-api', status: 'ok' };
  }

  async getHealth(): Promise<{
    status: string;
    postgres: string;
  }> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { status: 'degraded', postgres: 'DATABASE_URL missing' };
    }

    const client = new pg.Client({ connectionString: databaseUrl });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return { status: 'ok', postgres: 'up' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      return { status: 'error', postgres: message };
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
