import pino from 'pino';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../../src/app.js';
import { parseConfig, type AppConfig } from '../../src/config/env.js';
import { createContainer, type Container } from '../../src/container.js';
import { seedReferenceData } from '../../src/db/seed.js';
import { ExternalServiceError } from '../../src/errors/app.error.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';
import type { CrmAdapter, CrmLeadPayload } from '../../src/modules/integrations/crm.adapter.js';
import type { EmailProvider, OutgoingEmail, SendResult } from '../../src/modules/email/email.provider.js';
import { insertUser } from '../../src/modules/users/users.repository.js';
import { hashPassword } from '../../src/utils/password.js';
import type { Role } from '../../src/config/constants.js';
import type { FastifyInstance } from 'fastify';
import type { AppLogger } from '../../src/logger/index.js';

export function silentLogger(): AppLogger {
  return pino({ level: 'silent' }) as unknown as AppLogger;
}

/** Records messages instead of sending. `failNext` simulates a provider outage. */
export class FakeEmailProvider implements EmailProvider {
  readonly name = 'fake';
  readonly sent: OutgoingEmail[] = [];
  failing = false;

  async send(message: OutgoingEmail): Promise<SendResult> {
    if (this.failing) {
      throw new ExternalServiceError('email', 'Simulated provider outage.', { code: ErrorCodes.EXTERNAL_SERVICE_ERROR, retryable: true });
    }
    this.sent.push(message);
    return { messageId: `fake-${randomUUID()}`, accepted: true };
  }
}

export class FakeCrmAdapter implements CrmAdapter {
  readonly name = 'fake-crm';
  readonly upserts: CrmLeadPayload[] = [];

  async upsertLead(lead: CrmLeadPayload) {
    this.upserts.push(lead);
    return { externalId: `crm-${this.upserts.length}`, created: true };
  }
}

export interface TestContext {
  app: FastifyInstance;
  container: Container;
  email: FakeEmailProvider;
  crm: FakeCrmAdapter | null;
  config: AppConfig;
  close(): Promise<void>;
}

export const FIXED_NOW = new Date('2026-06-15T10:00:00.000Z');

export async function createTestContext(options: { crm?: boolean } = {}): Promise<TestContext> {
  const config = parseConfig({ ...process.env, NODE_ENV: 'test', LOG_LEVEL: 'silent' });
  const email = new FakeEmailProvider();
  const crm = options.crm ? new FakeCrmAdapter() : null;
  const container = createContainer(config, {
    logger: silentLogger(),
    email,
    crm,
    now: () => new Date(FIXED_NOW),
  });
  const app = await buildApp(container);
  await app.ready();
  return {
    app,
    container,
    email,
    crm,
    config,
    async close() {
      await app.close();
      await container.close();
    },
  };
}

/** Empties every application table and reloads reference data, so each test starts from a known state. */
export async function resetDatabase(ctx: TestContext): Promise<void> {
  const { db } = ctx.container;
  const result = await db.execute<{ tablename: string }>(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> '__drizzle_migrations'`,
  );
  const tables = result.rows.map((r) => `"${r.tablename}"`).join(', ');
  if (tables) await db.execute(`truncate table ${tables} restart identity cascade`);
  await seedReferenceData(db);
}

export async function createUser(ctx: TestContext, role: Role, name = `${role} user`): Promise<{ id: string; token: string }> {
  const user = await insertUser(ctx.container.db, {
    email: `${role}-${randomUUID().slice(0, 8)}@aranax.test`,
    name,
    role,
    passwordHash: await hashPassword('integration-password-123'),
  });
  return { id: user.id, token: ctx.app.signAccessToken(user.id) };
}

export function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

export function publicLeadPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'Test Lead',
    email: `lead-${randomUUID().slice(0, 8)}@example.com`,
    company: 'Example Ltd',
    consent: { privacyPolicy: true, privacyPolicyVersion: '2026-01', marketing: false },
    message: 'We are interested in an AI SaaS build.',
    ...overrides,
  };
}
