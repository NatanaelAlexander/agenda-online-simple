import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { resolveDatabaseUrl } from '../src/common/database/database-url.ts';

const SEPARATOR = '----------------------------------------';
const bdDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(bdDir, 'data-migration');
const rootDir = join(bdDir, '../..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function logOk(message: string): void {
  console.log(`${colors.green}[OK]${colors.reset} ${message}`);
}

function logErr(message: string): void {
  console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function logInfo(message: string): void {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`);
}

function listSqlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function main(): Promise<void> {
  let databaseUrl: string;

  try {
    databaseUrl = resolveDatabaseUrl(rootDir);
  } catch (error) {
    logErr(error instanceof Error ? error.message : 'DATABASE_URL inválida');
    process.exit(1);
  }

  logInfo('Iniciando data migrations (seeds)...');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
  } catch (error) {
    logErr('No se pudo conectar a PostgreSQL.');
    if (error instanceof Error) console.error(error.message);
    process.exit(1);
  }

  let failed = false;
  for (const file of listSqlFiles(dataDir)) {
    console.log(SEPARATOR);
    logInfo(file);
    try {
      await client.query(readFileSync(join(dataDir, file), 'utf-8'));
      logOk(`Aplicado: ${file}`);
    } catch (error) {
      logErr(`Falló: ${file}`);
      if (error instanceof Error) console.error(error.message);
      failed = true;
      break;
    }
  }

  await client.end();
  console.log(SEPARATOR);

  if (failed) {
    process.exit(1);
  }

  logOk('Seeds OK.');
  logInfo('superadmin@agenda.local / superadmin');
  logInfo('admin@agenda.local / admin');
}

main().catch((error: unknown) => {
  logErr('Error inesperado.');
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
});
