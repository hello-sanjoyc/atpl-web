import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { createOutboxWorker } from '../../src/jobs/workers/outbox.worker.js';
import { createTestContext, publicLeadPayload, resetDatabase, type TestContext } from '../helpers/test-app.js';
import { emailDeliveryLogs } from '../../src/db/schema/index.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext({ crm: true });
});

afterAll(async () => {
  await ctx.close();
});

beforeEach(async () => {
  await resetDatabase(ctx);
  ctx.email.failing = false;
  ctx.email.sent.length = 0;
  if (ctx.crm) ctx.crm.upserts.length = 0;
});

function worker() {
  return createOutboxWorker(ctx.container, { workerId: 'test-worker', pollIntervalMs: 10, batchSize: 50, leaseMs: 60_000 });
}

describe('transactional outbox', () => {
  it('keeps the lead when the email provider is down and retries until delivery', async () => {
    ctx.email.failing = true;
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: publicLeadPayload({ email: 'outage@example.com' }),
    });
    expect(response.statusCode).toBe(201);

    const outbox = worker();
    await outbox.tick();

    const [event] = await ctx.container.db.execute<{ status: string; attempts: number; last_error_code: string }>(
      sql`select status, attempts, last_error_code from outbox_events where type = 'email.acknowledgement'`,
    ).then((r) => r.rows);
    expect(event).toMatchObject({ status: 'failed', attempts: 1, last_error_code: 'EXTERNAL_SERVICE_ERROR' });
    expect(ctx.email.sent).toHaveLength(0);

    // Make the retry due now and let the provider recover.
    await ctx.container.db.execute(sql`update outbox_events set next_attempt_at = now() - interval '1 second' where type = 'email.acknowledgement'`);
    ctx.email.failing = false;
    await outbox.tick();

    expect(ctx.email.sent).toHaveLength(1);
    expect(ctx.email.sent[0]?.to).toBe('outage@example.com');

    // The sales notification is queued too and fails in the same outage; only the acknowledgement is checked here.
    const logs = await ctx.container.db
      .select({ status: emailDeliveryLogs.status })
      .from(emailDeliveryLogs)
      .where(eq(emailDeliveryLogs.template, 'lead_acknowledgement'));
    expect(logs.map((l) => l.status)).toEqual(['failed', 'provider_accepted']);
  });

  it('records a CRM event as skipped when no CRM is configured for it', async () => {
    const noCrm = await createTestContext({ crm: false });
    try {
      await noCrm.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload({ email: 'nocrm@example.com' }) });
      const outbox = createOutboxWorker(noCrm.container, { workerId: 'test', pollIntervalMs: 10, batchSize: 50, leaseMs: 60_000 });
      await outbox.tick();

      const rows = await noCrm.container.db.execute<{ status: string; last_error_code: string | null }>(
        sql`select status, last_error_code from outbox_events where type = 'crm.sync_lead'`,
      );
      expect(rows.rows[0]).toEqual({ status: 'skipped', last_error_code: 'crm_disabled' });
    } finally {
      await noCrm.close();
    }
  });

  it('syncs to the CRM adapter when one is configured', async () => {
    await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload({ email: 'crm@example.com' }) });
    await worker().tick();
    expect(ctx.crm?.upserts.map((u) => u.email)).toEqual(['crm@example.com']);
    const crmRows = await ctx.container.db.execute<{ status: string; external_id: string }>(
      sql`select status, external_id from crm_sync_records`,
    );
    expect(crmRows.rows).toEqual([{ status: 'synced', external_id: 'crm-1' }]);
  });
});
