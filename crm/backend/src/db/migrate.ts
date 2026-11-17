import { fileURLToPath, pathToFileURL } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config/env.js';
import { createRootLogger } from '../logger/index.js';
import { createDatabase, type Database } from './client.js';

/** Migrations ship as SQL in src/db/migrations; the path resolves from both src/ and dist/. */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../src/db/migrations', import.meta.url));

export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const config = loadConfig();
  const logger = createRootLogger(config);
  const { db, pool } = createDatabase(config, logger);
  logger.info({ event: 'system.migrations_started' }, 'Applying database migrations');
  runMigrations(db)
    .then(() => {
      logger.info({ event: 'system.migrations_completed' }, 'Database migrations applied');
    })
    .catch((error: unknown) => {
      logger.error({ event: 'system.migrations_failed', err: error }, 'Database migration failed');
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
