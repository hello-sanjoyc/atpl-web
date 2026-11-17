import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auth, createTestContext, createUser, publicLeadPayload, resetDatabase, type TestContext } from '../helpers/test-app.js';
import { leads } from '../../src/db/schema/index.js';

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

async function seedOpportunity(token: string): Promise<string> {
  await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload({ email: `opp-${Date.now()}@example.com` }) });
  const [lead] = await ctx.container.db.select({ id: leads.id }).from(leads).limit(1);
  const created = await ctx.app.inject({
    method: 'POST',
    url: '/api/v1/opportunities',
    headers: auth(token),
    payload: { leadId: lead!.id, title: 'AI pilot', estimatedValue: '1000.00', currency: 'EUR' },
  });
  expect(created.statusCode).toBe(201);
  return created.json().data.id as string;
}

describe('revenue and analytics', () => {
  it('reports insufficient_data instead of inventing a conversion when no rate is stored', async () => {
    const finance = await createUser(ctx, 'finance');
    const oppId = await seedOpportunity((await createUser(ctx, 'sales_manager')).token);
    const record = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/revenue-records',
      headers: auth(finance.token),
      payload: { opportunityId: oppId, kind: 'invoiced', amount: '1000.00', currency: 'EUR', recognizedOn: '2026-06-01' },
    });
    expect(record.statusCode).toBe(201);

    const overview = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/analytics/overview?year=2026&baseCurrency=USD',
      headers: auth(finance.token),
    });
    expect(overview.statusCode).toBe(200);
    expect(overview.json().data.revenue.invoiced).toMatchObject({ status: 'insufficient_data', missingCurrencies: ['EUR'] });
  });

  it('converts with a stored rate and reports the source-backed result', async () => {
    const finance = await createUser(ctx, 'finance');
    const oppId = await seedOpportunity((await createUser(ctx, 'sales_manager')).token);
    await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/revenue-records',
      headers: auth(finance.token),
      payload: { opportunityId: oppId, kind: 'invoiced', amount: '1000.00', currency: 'EUR', recognizedOn: '2026-06-01' },
    });
    const rate = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/exchange-rates',
      headers: auth(finance.token),
      payload: { base: 'EUR', quote: 'USD', rate: '1.08000000', rateDate: '2026-06-01', source: 'fixture-feed' },
    });
    expect(rate.statusCode).toBe(201);

    const overview = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/analytics/overview?year=2026&baseCurrency=USD',
      headers: auth(finance.token),
    });
    expect(overview.json().data.revenue.invoiced).toEqual({ status: 'ok', amount: '1080.00', currency: 'USD' });
  });

  it('rejects revenue records that link to nothing', async () => {
    const finance = await createUser(ctx, 'finance');
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/revenue-records',
      headers: auth(finance.token),
      payload: { kind: 'invoiced', amount: '10.00', currency: 'USD', recognizedOn: '2026-06-01' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('omits financial figures from roles that may read analytics but not financials', async () => {
    const analyst = await createUser(ctx, 'read_only_analyst');
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/analytics/overview?year=2026', headers: auth(analyst.token) });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.revenue).toBeUndefined();
  });

  it('denies the overview to roles without analytics.read', async () => {
    const sales = await createUser(ctx, 'sales_executive');
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/analytics/overview?year=2026', headers: auth(sales.token) });
    expect(response.statusCode).toBe(403);
  });

  it('exports leads as CSV with protective headers', async () => {
    const manager = await createUser(ctx, 'sales_manager');
    await ctx.app.inject({ method: 'POST', url: '/api/v1/public/leads', payload: publicLeadPayload({ email: 'export@example.com' }) });
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/exports/leads.csv', headers: auth(manager.token) });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['x-export-row-count']).toBe('1');
    expect(response.body.split('\r\n')[0]).toContain('id,name,email');
  });

  it('forbids lead exports to read-only analysts', async () => {
    const analyst = await createUser(ctx, 'read_only_analyst');
    const response = await ctx.app.inject({ method: 'GET', url: '/api/v1/exports/leads.csv', headers: auth(analyst.token) });
    expect(response.statusCode).toBe(403);
  });
});
