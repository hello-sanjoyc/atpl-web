import { desc, eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { opportunityStageHistory } from '../../db/schema/index.js';
import { findOpportunityById } from '../opportunities/opportunities.repository.js';

export interface OpportunityHealthResult {
  opportunityId: string;
  healthScore: number;         // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  stalledDays: number | null;
  risks: string[];
  strengths: string[];
  nextSteps: string[];
  summary: string;
}

const HEALTH_PROMPT = (opp: {
  title: string;
  stage: string;
  status: string;
  probability: string;
  estimatedValue: string;
  currency: string;
  expectedCloseDate: string | null;
  daysSinceLastMove: number | null;
  stageMoves: number;
  serviceInterest: string | null;
}) => `You are a B2B sales intelligence analyst. Assess the health of this sales opportunity and return a JSON object.

Opportunity:
- Title: ${opp.title}
- Stage: ${opp.stage}
- Status: ${opp.status}
- Win probability: ${(Number(opp.probability) * 100).toFixed(0)}%
- Estimated value: ${opp.estimatedValue} ${opp.currency}
- Expected close: ${opp.expectedCloseDate ?? 'Not set'}
- Days since last stage move: ${opp.daysSinceLastMove ?? 'unknown'}
- Total stage moves: ${opp.stageMoves}
- Service: ${opp.serviceInterest ?? 'unknown'}

Return ONLY valid JSON:
{
  "healthScore": <0-100>,
  "riskLevel": "low" | "medium" | "high",
  "risks": ["<risk>"],
  "strengths": ["<strength>"],
  "nextSteps": ["<actionable step>"],
  "summary": "<2 sentence summary>"
}`;

export async function analyzeOpportunityHealth(deps: Container, opportunityId: string): Promise<OpportunityHealthResult> {
  const opp = await findOpportunityById(deps.db, opportunityId);
  if (!opp) throw new Error('Opportunity not found');

  // Compute days since last stage move
  const history = await deps.db
    .select()
    .from(opportunityStageHistory)
    .where(eq(opportunityStageHistory.opportunityId, opportunityId))
    .orderBy(desc(opportunityStageHistory.createdAt))
    .limit(1);

  const lastMoveAt = history[0]?.createdAt ?? opp.createdAt;
  const daysSinceLastMove = lastMoveAt
    ? Math.floor((Date.now() - new Date(lastMoveAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const totalMoves = await deps.db
    .select()
    .from(opportunityStageHistory)
    .where(eq(opportunityStageHistory.opportunityId, opportunityId));

  // Heuristic stall detection (no AI needed for this part)
  const stalledDays = daysSinceLastMove !== null && daysSinceLastMove > 14 ? daysSinceLastMove : null;

  if (!(await deps.ai.isAvailable())) {
    // Fallback: heuristic-only result
    const heuristicScore = Math.round(Number(opp.probability) * 100);
    const riskLevel = stalledDays && stalledDays > 30 ? 'high' : stalledDays && stalledDays > 14 ? 'medium' : 'low';
    return {
      opportunityId,
      healthScore: heuristicScore,
      riskLevel,
      stalledDays,
      risks: stalledDays ? [`No stage movement for ${stalledDays} days`] : [],
      strengths: [],
      nextSteps: ['Review opportunity with account owner'],
      summary: `Win probability ${Math.round(Number(opp.probability) * 100)}%. ${stalledDays ? `Stalled for ${stalledDays} days.` : ''}`,
    };
  }

  const result = await deps.ai.complete({
    kind: 'opportunity_health',
    messages: [{
      role: 'user',
      content: HEALTH_PROMPT({
        title: opp.title,
        stage: opp.stage,
        status: opp.status,
        probability: opp.probability,
        estimatedValue: String(opp.estimatedValue),
        currency: opp.currency,
        expectedCloseDate: opp.expectedCloseDate,
        daysSinceLastMove,
        stageMoves: totalMoves.length,
        serviceInterest: opp.serviceInterest,
      }),
    }],
    maxTokens: 500,
  });

  let parsed: Omit<OpportunityHealthResult, 'opportunityId' | 'stalledDays'>;
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? result.text);
  } catch {
    parsed = {
      healthScore: Math.round(Number(opp.probability) * 100),
      riskLevel: 'medium',
      risks: [],
      strengths: [],
      nextSteps: ['Review with account owner'],
      summary: 'Could not parse AI health analysis.',
    };
  }

  return {
    opportunityId,
    stalledDays,
    ...parsed,
    healthScore: Math.min(100, Math.max(0, Math.round(parsed.healthScore))),
  };
}
