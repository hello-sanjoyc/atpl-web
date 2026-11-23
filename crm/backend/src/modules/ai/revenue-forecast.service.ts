import { desc, eq, sql } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { forecastSnapshots } from '../../db/schema/index.js';
import { listOpenOpportunities } from '../opportunities/opportunities.repository.js';
import { getAppSetting, setAppSetting } from '../settings/app-settings.repository.js';
import type { ForecastBand } from '../../db/schema/ai.js';

export interface ForecastResult {
  snapshotDate: string;
  band30: ForecastBand;
  band60: ForecastBand;
  band90: ForecastBand;
  openOpportunityCount: number;
  aiNarrative: string | null;
  createdAt: string;
  /** ISO timestamp after which Refresh will call the LLM again, rather than returning this same snapshot. */
  nextRefreshAt: string;
}

function heuristicBand(
  opps: Array<{ estimatedValue: string | number; probability: string; expectedCloseDate: string | null }>,
  withinDays: number,
  currency: string,
): ForecastBand {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  const inWindow = opps.filter((o) => {
    if (!o.expectedCloseDate) return false;
    return new Date(o.expectedCloseDate) <= cutoff;
  });

  const expected = inWindow.reduce((sum, o) => sum + Number(o.estimatedValue) * Number(o.probability), 0);
  const best = inWindow.reduce((sum, o) => sum + Number(o.estimatedValue), 0);
  const worst = inWindow.filter((o) => Number(o.probability) >= 0.7).reduce((sum, o) => sum + Number(o.estimatedValue) * Number(o.probability), 0);

  return { expected: Math.round(expected), best: Math.round(best), worst: Math.round(worst), currency };
}

const FORECAST_NARRATIVE_PROMPT = (ctx: {
  openCount: number;
  band30: ForecastBand;
  band60: ForecastBand;
  band90: ForecastBand;
  topOpps: Array<{ title: string; stage: string; value: string; probability: string; closeDate: string | null }>;
}) => `You are a revenue analyst. Write a 3-4 sentence executive summary of this sales pipeline forecast.
Be specific about revenue, risk, and what the team should focus on. Output only the narrative text — no headers, no JSON.

Pipeline overview:
- Open opportunities: ${ctx.openCount}
- 30-day forecast: expected ${ctx.band30.currency} ${ctx.band30.expected.toLocaleString()}, best case ${ctx.band30.best.toLocaleString()}, worst case ${ctx.band30.worst.toLocaleString()}
- 60-day forecast: expected ${ctx.band60.currency} ${ctx.band60.expected.toLocaleString()}, best ${ctx.band60.best.toLocaleString()}, worst ${ctx.band60.worst.toLocaleString()}
- 90-day forecast: expected ${ctx.band90.currency} ${ctx.band90.expected.toLocaleString()}, best ${ctx.band90.best.toLocaleString()}, worst ${ctx.band90.worst.toLocaleString()}

Top opportunities:
${ctx.topOpps.map((o) => `- ${o.title} (${o.stage}, ${o.value}, ${o.probability} win prob, closes ${o.closeDate ?? 'TBD'})`).join('\n')}`;

/** Default minimum time between LLM-backed forecast regenerations, used until a super_admin overrides it. */
export const DEFAULT_FORECAST_REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

const FORECAST_COOLDOWN_SETTING_KEY = 'forecast.refresh_cooldown_ms';
const MIN_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Reads the configurable cooldown from app_settings, falling back to the default if unset or invalid. */
export async function getForecastCooldownMs(deps: Container): Promise<number> {
  const stored = await getAppSetting(deps.db, FORECAST_COOLDOWN_SETTING_KEY);
  const ms = typeof stored === 'number' ? stored : Number(stored);
  if (!Number.isFinite(ms) || ms < MIN_COOLDOWN_MS || ms > MAX_COOLDOWN_MS) return DEFAULT_FORECAST_REFRESH_COOLDOWN_MS;
  return ms;
}

export async function setForecastCooldownMs(deps: Container, ms: number, updatedBy: string): Promise<number> {
  if (!Number.isFinite(ms) || ms < MIN_COOLDOWN_MS || ms > MAX_COOLDOWN_MS) {
    throw new RangeError(`Cooldown must be between ${MIN_COOLDOWN_MS}ms and ${MAX_COOLDOWN_MS}ms.`);
  }
  await setAppSetting(deps.db, FORECAST_COOLDOWN_SETTING_KEY, ms, updatedBy);
  return ms;
}

export async function generateForecast(deps: Container, currency = 'USD'): Promise<ForecastResult> {
  const opps = await listOpenOpportunities(deps.db, {});

  const band30 = heuristicBand(opps, 30, currency);
  const band60 = heuristicBand(opps, 60, currency);
  const band90 = heuristicBand(opps, 90, currency);
  const snapshotDate = new Date().toISOString().slice(0, 10);

  let aiNarrative: string | null = null;

  if ((await deps.ai.isAvailable()) && opps.length > 0) {
    const topOpps = opps
      .sort((a, b) => Number(b.estimatedValue) * Number(b.probability) - Number(a.estimatedValue) * Number(a.probability))
      .slice(0, 5)
      .map((o) => ({
        title: o.title,
        stage: o.stage,
        value: `${o.currency} ${Number(o.estimatedValue).toLocaleString()}`,
        probability: `${Math.round(Number(o.probability) * 100)}%`,
        closeDate: o.expectedCloseDate,
      }));

    try {
      const result = await deps.ai.complete({
        kind: 'revenue_forecast',
        messages: [{ role: 'user', content: FORECAST_NARRATIVE_PROMPT({ openCount: opps.length, band30, band60, band90, topOpps }) }],
        maxTokens: 300,
      });
      aiNarrative = result.text.trim();
    } catch (err) {
      deps.logger.warn({ err }, 'Forecast narrative generation failed');
    }
  }

  const [inserted] = await deps.db
    .insert(forecastSnapshots)
    .values({ snapshotDate, band30, band60, band90, openOpportunityCount: opps.length, aiNarrative })
    .returning();

  const cooldownMs = await getForecastCooldownMs(deps);
  return {
    snapshotDate,
    band30,
    band60,
    band90,
    openOpportunityCount: opps.length,
    aiNarrative,
    createdAt: inserted.createdAt.toISOString(),
    nextRefreshAt: new Date(inserted.createdAt.getTime() + cooldownMs).toISOString(),
  };
}

export async function getLatestForecast(deps: Container): Promise<ForecastResult | null> {
  const rows = await deps.db
    .select()
    .from(forecastSnapshots)
    .orderBy(desc(forecastSnapshots.createdAt))
    .limit(1);

  if (!rows[0]) return null;

  const r = rows[0];
  const cooldownMs = await getForecastCooldownMs(deps);
  return {
    snapshotDate: r.snapshotDate,
    band30: r.band30,
    band60: r.band60,
    band90: r.band90,
    openOpportunityCount: r.openOpportunityCount,
    aiNarrative: r.aiNarrative,
    createdAt: r.createdAt.toISOString(),
    nextRefreshAt: new Date(r.createdAt.getTime() + cooldownMs).toISOString(),
  };
}
