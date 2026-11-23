import type { Container } from '../../container.js';
import { resolvePeriod, type PeriodQuery } from '../../utils/period.js';
import { toDateString, type PeriodBounds, getChannelAttribution, getCampaignAttribution, type ChannelAttribution, type CampaignAttribution } from '../analytics/analytics.repository.js';

export interface ChannelInsight extends ChannelAttribution {
  qualificationRate: string;
  conversionRate: string;
  winRate: string;
  aiInsight: string | null;
}

export interface AttributionReport {
  period: { from: string; to: string };
  channels: ChannelInsight[];
  campaigns: CampaignAttribution[];
  topChannel: string | null;
  aiSummary: string | null;
}

function rate(num: number, denom: number): string {
  if (denom === 0) return '0.0000';
  return (num / denom).toFixed(4);
}

export async function generateAttributionReport(deps: Container, query: PeriodQuery): Promise<AttributionReport> {
  const { db, ai, logger } = deps;
  const log = logger.child({ module: 'marketing-attribution' });
  const resolved = resolvePeriod(query, deps.now());
  const period: PeriodBounds = resolved;

  const [channelRows, campaignRows] = await Promise.all([
    getChannelAttribution(db, period),
    getCampaignAttribution(db, period),
  ]);

  const channels: ChannelInsight[] = channelRows.map((ch) => ({
    ...ch,
    qualificationRate: rate(ch.qualifiedLeads, ch.leadsCreated),
    conversionRate: rate(ch.opportunities, ch.leadsCreated),
    winRate: rate(ch.wonOpportunities, ch.opportunities),
    aiInsight: null,
  }));

  // Sort by leadsCreated descending for display
  channels.sort((a, b) => b.leadsCreated - a.leadsCreated);

  const topChannel = channels.length > 0 ? channels[0]!.channel : null;

  let aiSummary: string | null = null;

  if ((await ai.isAvailable()) && channels.length > 0) {
    try {
      const channelSummary = channels
        .slice(0, 10)
        .map(
          (c) =>
            `${c.channel}: ${c.leadsCreated} leads, ${(Number(c.qualificationRate) * 100).toFixed(1)}% qualified, ` +
            `${(Number(c.conversionRate) * 100).toFixed(1)}% → opp, ${(Number(c.winRate) * 100).toFixed(1)}% win rate, ` +
            `$${Number(c.revenueAttributed).toLocaleString()} revenue`,
        )
        .join('\n');

      const summaryResponse = await ai.complete({
        kind: 'attribution_summary',
        messages: [
          {
            role: 'user',
            content:
              `You are a marketing analytics expert. Summarise the following channel attribution data for the period ` +
              `${toDateString(resolved.from)} to ${toDateString(new Date(resolved.to.getTime() - 86_400_000))} ` +
              `in 2-3 sentences. Highlight the best-performing channel, any notable conversion patterns, and one actionable recommendation.\n\n` +
              channelSummary,
          },
        ],
      });
      aiSummary = summaryResponse.text.trim();

      // Per-channel insights for top 5 channels (brief)
      for (let i = 0; i < Math.min(5, channels.length); i++) {
        const c = channels[i]!;
        try {
          const insightResponse = await ai.complete({
            kind: 'attribution_channel_insight',
            messages: [
              {
                role: 'user',
                content:
                  `In one sentence, give a marketing insight for the "${c.channel}" channel: ` +
                  `${c.leadsCreated} leads, ${(Number(c.qualificationRate) * 100).toFixed(1)}% qualification rate, ` +
                  `${(Number(c.conversionRate) * 100).toFixed(1)}% lead-to-opportunity rate, ` +
                  `${(Number(c.winRate) * 100).toFixed(1)}% win rate, $${Number(c.revenueAttributed).toLocaleString()} revenue.`,
              },
            ],
          });
          channels[i]!.aiInsight = insightResponse.text.trim();
        } catch {
          // non-fatal per-channel failure
        }
      }
    } catch (err) {
      log.warn({ err }, 'AI attribution summary failed — returning without AI insights');
    }
  }

  return {
    period: {
      from: toDateString(resolved.from),
      to: toDateString(new Date(resolved.to.getTime() - 86_400_000)),
    },
    channels,
    campaigns: campaignRows,
    topChannel,
    aiSummary,
  };
}
