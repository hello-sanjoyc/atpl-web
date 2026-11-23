import { count, desc, eq, gte, sql } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { campaigns, customers, followUpTasks, leads, opportunities, referrals, revenueRecords } from '../../db/schema/index.js';
import { sumRevenueByCurrency } from '../revenue/revenue.repository.js';
import type { AuthUser } from '../../types/fastify.js';

export interface CopilotQueryResult {
  answer: string;
  dataUsed: string[];
}

/** Gather a brief pipeline snapshot to give the copilot fresh context. */
async function buildPipelineContext(db: Container['db']): Promise<string> {
  const [leadStats] = await db
    .select({ total: count(), newLeads: sql<number>`count(*) filter (where stage = 'new_lead')` })
    .from(leads);

  const [oppStats] = await db
    .select({ open: count(), totalValue: sql<string>`coalesce(sum(estimated_value), 0)` })
    .from(opportunities)
    .where(eq(opportunities.status, 'open'));

  const recentLeads = await db
    .select({ id: leads.id, name: leads.name, stage: leads.stage, score: leads.score, createdAt: leads.createdAt })
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(5);

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
  const from = ninetyDaysAgo.toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const [invoicedByCurrency, collectedByCurrency, [revenueTotals]] = await Promise.all([
    sumRevenueByCurrency(db, { kind: 'invoiced', from, to }),
    sumRevenueByCurrency(db, { kind: 'collected', from, to }),
    db.select({ records: count() }).from(revenueRecords).where(gte(revenueRecords.recognizedOn, from)),
  ]);
  const fmtByCurrency = (rows: Array<{ currency: string; total: string }>) =>
    rows.length > 0 ? rows.map((r) => `${r.currency} ${r.total}`).join(', ') : 'none';

  const [followUpStats] = await db
    .select({
      open: sql<number>`count(*) filter (where status = 'open')`,
      overdue: sql<number>`count(*) filter (where status = 'open' and due_at < now())`,
    })
    .from(followUpTasks);

  const upcomingFollowUps = await db
    .select({ id: followUpTasks.id, title: followUpTasks.title, status: followUpTasks.status, dueAt: followUpTasks.dueAt })
    .from(followUpTasks)
    .where(eq(followUpTasks.status, 'open'))
    .orderBy(followUpTasks.dueAt)
    .limit(5);

  const [customerStats] = await db
    .select({ total: count(), active: sql<number>`count(*) filter (where status = 'active')` })
    .from(customers);

  const [campaignStats] = await db
    .select({ total: count(), active: sql<number>`count(*) filter (where status = 'active')` })
    .from(campaigns);

  const [referralStats] = await db.select({ total: count() }).from(referrals);

  const ref = (type: string, id: string, label: string) => `[[${type}:${id}|${label}]]`;

  return `
CRM Snapshot (live):
- Total leads: ${leadStats?.total ?? 0}, new_lead stage: ${leadStats?.newLeads ?? 0}
- Open opportunities: ${oppStats?.open ?? 0}, combined value: ${oppStats?.totalValue ?? 0}
- 5 most recent leads: ${recentLeads.map((l) => `${ref('lead', l.id, l.name)} (${l.stage}, score ${l.score})`).join('; ')}
- Follow-ups: ${followUpStats?.open ?? 0} open, ${followUpStats?.overdue ?? 0} overdue; next up: ${upcomingFollowUps.map((f) => `${ref('followup', f.id, f.title)} (due ${f.dueAt.toISOString().slice(0, 10)})`).join('; ') || 'none'}
- Customers: ${customerStats?.total ?? 0} total, ${customerStats?.active ?? 0} active
- Revenue, last 90 days (${from} to ${to}), ${revenueTotals?.records ?? 0} records: invoiced ${fmtByCurrency(invoicedByCurrency)}; collected ${fmtByCurrency(collectedByCurrency)}
- Campaigns: ${campaignStats?.total ?? 0} total, ${campaignStats?.active ?? 0} active
- Referrals: ${referralStats?.total ?? 0} total
`.trim();
}

const COPILOT_SYSTEM = (pipelineContext: string, userName: string, role: string) => `
You are an AI Sales Copilot for Aranax Technologies' CRM. You help sales reps and managers answer questions about their leads, opportunities, follow-ups, customers, revenue, campaigns, and referrals.

User: ${userName} (role: ${role})

${pipelineContext}

Guidelines:
- Answer concisely in 2-5 sentences.
- Reference actual numbers from the snapshot when answering.
- Some snapshot items are written as [[type:id|Name]] (e.g. [[lead:3f2.../Acme Corp]]) — when you mention one of those specific named records in your answer, copy its [[type:id|Name]] marker exactly as given instead of writing just the name. Only use markers that appear in the snapshot above; never invent one. Do not use markers for aggregate figures like counts or totals.
- If the user asks to take an action (create, update, delete), explain that you can only provide information — they should use the CRM interface.
- Never invent data not present in the snapshot.
- Keep responses professional but conversational.
`.trim();

export function createSalesCopilotService(deps: Container) {
  return {
    async query(user: AuthUser, question: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<CopilotQueryResult> {
      if (!(await deps.ai.isAvailable())) {
        return { answer: 'The AI copilot is not configured. Please set ANTHROPIC_API_KEY.', dataUsed: [] };
      }

      const pipelineContext = await buildPipelineContext(deps.db);

      const result = await deps.ai.complete({
        kind: 'copilot_query',
        actorId: user.id,
        system: COPILOT_SYSTEM(pipelineContext, user.name, user.role),
        messages: [
          ...conversationHistory,
          { role: 'user', content: question },
        ],
        maxTokens: 400,
      });

      return {
        answer: result.text,
        dataUsed: [
          'leads_count',
          'open_opportunities',
          'recent_leads',
          'follow_ups',
          'customers_count',
          'revenue_last_90d',
          'campaigns_count',
          'referrals_count',
        ],
      };
    },
  };
}
