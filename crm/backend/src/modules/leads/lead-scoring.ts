import { QUALIFICATION_THRESHOLD } from '../../config/constants.js';

export interface ScoreInput {
  budgetRange?: string | null;
  timeline?: string | null;
  decisionMaker?: boolean;
  hasCompany: boolean;
  serviceInterest?: string | null;
  discoveryRequested?: boolean;
}

export interface ScoreResult {
  score: number;
  priority: 'low' | 'medium' | 'high';
  qualified: boolean;
  breakdown: Record<string, number>;
}

const BUDGET_POINTS: Record<string, number> = { unknown: 0, under_5k: 5, '5k_20k': 20, '20k_50k': 30, over_50k: 40 };
const TIMELINE_POINTS: Record<string, number> = { exploring: 3, three_to_six_months: 10, one_to_three_months: 20, immediate: 25 };
const SERVICE_POINTS: Record<string, number> = {
  ai_saas_development: 10,
  rag_ai_chatbot_development: 10,
  ai_agents_voice_automation: 10,
  white_label_development_agencies: 8,
};

/**
 * Deterministic lead score in the range 0..100. Weights sum to 100 at maximum:
 * budget 40, timeline 25, decision maker 15, service fit 10, company 5, discovery request 5.
 */
export function scoreLead(input: ScoreInput): ScoreResult {
  const breakdown = {
    budget: BUDGET_POINTS[input.budgetRange ?? 'unknown'] ?? 0,
    timeline: TIMELINE_POINTS[input.timeline ?? ''] ?? 0,
    decisionMaker: input.decisionMaker ? 15 : 0,
    serviceFit: SERVICE_POINTS[input.serviceInterest ?? ''] ?? 0,
    company: input.hasCompany ? 5 : 0,
    discovery: input.discoveryRequested ? 5 : 0,
  };
  const score = Math.min(100, Object.values(breakdown).reduce((sum, v) => sum + v, 0));
  const priority = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return { score, priority, qualified: score >= QUALIFICATION_THRESHOLD, breakdown };
}

/** Counts URLs in free text. Used by the spam heuristic. */
export function countUrls(text: string | undefined): number {
  if (!text) return 0;
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}
