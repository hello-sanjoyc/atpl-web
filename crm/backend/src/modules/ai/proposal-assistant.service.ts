import { desc, eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { conversations, proposalVersions } from '../../db/schema/index.js';
import { findOpportunityById } from '../opportunities/opportunities.repository.js';
import type { ProposalSection } from '../../db/schema/ai.js';

export interface GenerateProposalResult {
  proposalVersionId: string;
  version: number;
  sections: ProposalSection[];
  markdownContent: string;
}

const PROPOSAL_PROMPT = (ctx: {
  title: string;
  serviceInterest: string | null;
  estimatedValue: string;
  currency: string;
  stage: string;
  conversationSummaries: string[];
}) => `You are a professional B2B proposal writer for Aranax Technologies — a software and AI company.
Generate a structured sales proposal in Markdown based on the opportunity details below.

Opportunity:
- Title: ${ctx.title}
- Service: ${ctx.serviceInterest ?? 'Custom Software'}
- Estimated value: ${ctx.estimatedValue} ${ctx.currency}
- Stage: ${ctx.stage}

Recent conversation context:
${ctx.conversationSummaries.length ? ctx.conversationSummaries.map((s, i) => `[${i + 1}] ${s}`).join('\n') : 'No prior conversations recorded.'}

Write a professional proposal with these sections:
1. Executive Summary
2. Understanding Your Requirements
3. Our Proposed Solution
4. Engagement Model & Timeline
5. Investment
6. Why Aranax
7. Next Steps

Return ONLY a JSON object:
{
  "sections": [
    {"heading": "<section title>", "content": "<markdown content for this section>"}
  ],
  "markdownContent": "<full proposal as a single Markdown string>"
}`;

export async function generateProposal(
  deps: Container,
  opportunityId: string,
  actorId: string,
): Promise<GenerateProposalResult> {
  const opp = await findOpportunityById(deps.db, opportunityId);
  if (!opp) throw new Error('Opportunity not found');

  if (!(await deps.ai.isAvailable())) throw new Error('AI not configured — set ANTHROPIC_API_KEY');

  // Gather recent conversation summaries linked to the opportunity's lead
  const conversationRows = opp.leadId
    ? await deps.db
        .select({ summary: conversations.summary })
        .from(conversations)
        .where(eq(conversations.leadId, opp.leadId))
        .orderBy(desc(conversations.createdAt))
        .limit(5)
    : [];

  const summaries = conversationRows.map((r) => r.summary).filter(Boolean) as string[];

  const result = await deps.ai.complete({
    kind: 'generate_proposal',
    actorId,
    messages: [{
      role: 'user',
      content: PROPOSAL_PROMPT({
        title: opp.title,
        serviceInterest: opp.serviceInterest,
        estimatedValue: String(opp.estimatedValue),
        currency: opp.currency,
        stage: opp.stage,
        conversationSummaries: summaries,
      }),
    }],
    maxTokens: 3000,
  });

  let parsed: { sections: ProposalSection[]; markdownContent: string };
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? result.text);
  } catch {
    // Fallback: wrap raw text as a single section
    parsed = {
      sections: [{ heading: 'Proposal', content: result.text }],
      markdownContent: result.text,
    };
  }

  // Get current max version for this opportunity
  const existing = await deps.db
    .select({ version: proposalVersions.version })
    .from(proposalVersions)
    .where(eq(proposalVersions.opportunityId, opportunityId))
    .orderBy(desc(proposalVersions.version))
    .limit(1);

  const nextVersion = (existing[0]?.version ?? 0) + 1;

  const [inserted] = await deps.db
    .insert(proposalVersions)
    .values({
      opportunityId,
      version: nextVersion,
      sections: parsed.sections,
      markdownContent: parsed.markdownContent,
      actorId: actorId || null,
    })
    .returning();

  return {
    proposalVersionId: inserted.id,
    version: nextVersion,
    sections: parsed.sections,
    markdownContent: parsed.markdownContent,
  };
}

export async function listProposals(deps: Container, opportunityId: string) {
  return deps.db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.opportunityId, opportunityId))
    .orderBy(desc(proposalVersions.version));
}
