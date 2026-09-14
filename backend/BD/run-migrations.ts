import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { resolveDatabaseUrl } from '../src/common/database/database-url.ts';

const SEPARATOR = '----------------------------------------';
const bdDir = dirname(fileURLToPath(import.meta.url));
const migrationDir = join(bdDir, 'migration');
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

async function runSqlFile(
  client: Client,
  sqlFile: string,
  label: string,
): Promise<boolean> {
  console.log(SEPARATOR);
  logInfo(label);

  try {
    const sql = readFileSync(sqlFile, 'utf-8');
    await client.query(sql);
    logOk(`Aplicado: ${label}`);
    return true;
  } catch (error) {
    logErr(`Falló: ${label}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

async function main(): Promise<void> {
  let databaseUrl: string;

  try {
    databaseUrl = resolveDatabaseUrl(rootDir);
  } catch (error) {
    logErr(error instanceof Error ? error.message : 'DATABASE_URL inválida');
    process.exit(1);
  }

  logInfo(`Base: ${process.env.POSTGRES_DB ?? 'agenda_online_simple'}`);
  logInfo('Iniciando migraciones de esquema...');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
  } catch (error) {
    logErr('No se pudo conectar a PostgreSQL.');
    logInfo('Levanta: docker compose up bd_main -d');
    if (error instanceof Error) console.error(error.message);
    process.exit(1);
  }

  let failed = false;
  for (const file of listSqlFiles(migrationDir)) {
    const ok = await runSqlFile(client, join(migrationDir, file), file);
    if (!ok) {
      failed = true;
      break;
    }
  }

  await client.end();
  console.log(SEPARATOR);

  if (failed) {
    logErr('Migraciones incompletas.');
    process.exit(1);
  }

  logOk('Esquema OK.');
}

main().catch((error: unknown) => {
  logErr('Error inesperado.');
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
});
