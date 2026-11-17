import { beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';

/** Integration tests run only against the dedicated test database, never the development one. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://aranax:aranax_dev@localhost:5432/aranax_lead_api_test';
if (!/_test/.test(new URL(TEST_DATABASE_URL).pathname)) {
  throw new Error('TEST_DATABASE_URL must point to a database whose name contains "_test".');
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = createHash('sha256').update('integration-test-secret').digest('hex');
process.env.RATE_LIMIT_MAX = '100000';
process.env.PUBLIC_RATE_LIMIT_MAX = '100000';
process.env.SMTP_HOST = '';
process.env.CRM_PROVIDER = 'none';
process.env.BOOKING_PROVIDER = 'calendly';
process.env.BOOKING_WEBHOOK_SECRET = 'integration-booking-secret-0123456789';
process.env.SALES_NOTIFICATION_EMAIL = 'sales@aranax.test';

beforeAll(async () => {
  const { createDatabase } = await import('../../src/db/client.js');
  const { runMigrations } = await import('../../src/db/migrate.js');
  const { silentLogger } = await import('./test-app.js');
  const { loadConfig } = await import('../../src/config/env.js');
  const config = loadConfig();
  const handle = createDatabase(config, silentLogger() as never);
  await runMigrations(handle.db);
  await handle.pool.end();
});

afterAll(async () => {
  // Pools are closed per test application; nothing global to release here.
});
