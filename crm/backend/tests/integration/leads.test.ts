import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auth, createTestContext, createUser, publicLeadPayload, resetDatabase, type TestContext } from '../helpers/test-app.js';
import { leads } from '../../src/db/schema/index.js';
import { sql } from 'drizzle-orm';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext();
});

afterAll(async () => {
  await ctx.close();
});

beforeEach(async () => {
  await resetDatabase(ctx);
});

describe('public lead capture', () => {
  it('stores the lead and acknowledges receipt without claiming delivery', async () => {
    const payload = publicLeadPayload({ email: 'capture@example.com' });
    const response = await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ success: true, data: { status: 'received' } });

    const [row] = await ctx.container.db.select().from(leads).where(sql`lower(${leads.email}) = 'capture@example.com'`);
    expect(row?.name).toBe('Test Lead');
    expect(row?.formSource).toBeTruthy();
  });

  it('replays the original response for the same idempotency key and body', async () => {
    const payload = publicLeadPayload();
    const headers = { 'idempotency-key': 'replay-key-000001' };
    const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload, headers });
    const second = await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload, headers });

    expect(second.statusCode).toBe(first.statusCode);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.json().data.reference).toBe(first.json().data.reference);
  });

  it('rejects reuse of an idempotency key with a different body', async () => {
    const headers = { 'idempotency-key': 'mismatch-key-00001' };
    await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload(), headers });
    const conflicting = await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload(), headers });

    expect(conflicting.statusCode).toBe(422);
  });

  it('silently drops submissions that fill the honeypot field', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: publicLeadPayload({ email: 'bot@example.com', website: 'https://spam.example' }),
    });
    expect(response.statusCode).toBeLessThan(500);

    const rows = await ctx.container.db.select({ id: leads.id }).from(leads).where(sql`lower(${leads.email}) = 'bot@example.com'`);
    expect(rows).toHaveLength(0);
  });

  it('refuses submissions without privacy consent', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/public/leads',
      payload: publicLeadPayload({ consent: { privacyPolicy: false, privacyPolicyVersion: '2026-01', marketing: false } }),
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('lead access control', () => {
  it('requires authentication for the internal lead list', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/leads' });
    expect(response.statusCode).toBe(401);
  });

  it('returns 404 for a lead owned by another executive', async () => {
    const owner = await createUser(ctx, 'sales_executive', 'Owner');
    const other = await createUser(ctx, 'sales_executive', 'Other');
    await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload({ email: 'owned@example.com' }) });
    const [lead] = await ctx.container.db.select({ id: leads.id }).from(leads);

    const assign = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/leads/${lead!.id}/assign`,
      headers: auth(ctx.app.signAccessToken((await createUser(ctx, 'sales_manager')).id)),
      payload: { ownerId: owner.id },
    });
    expect(assign.statusCode).toBe(200);

    const asOther = await ctx.app.inject({ method: 'GET', url: `/api/v1/leads/${lead!.id}`, headers: auth(other.token) });
    expect(asOther.statusCode).toBe(404);

    const asOwner = await ctx.app.inject({ method: 'GET', url: `/api/v1/leads/${lead!.id}`, headers: auth(owner.token) });
    expect(asOwner.statusCode).toBe(200);
  });
});
