import type { Container } from '../../container.js';
import type { EnrichmentData } from '../../db/schema/leads.js';
import { updateLeadRow } from '../leads/leads.repository.js';

const ENRICHMENT_PROMPT = (lead: { name: string; company: string | null; email: string }) => `
You are a B2B data analyst. Based on the company name and email domain below, infer reasonable company information.
Be conservative — only provide high-confidence inferences. Output ONLY valid JSON, nothing else.

Company name: ${lead.company ?? 'unknown'}
Contact email domain: ${lead.email.split('@')[1] ?? 'unknown'}
Contact name: ${lead.name}

Output JSON in this exact shape (omit fields you can't infer):
{
  "companySize": "1-10" | "11-50" | "51-200" | "201-1000" | "1001+",
  "industry": "<string>",
  "website": "<domain if confident>",
  "techStack": ["<tech1>", "<tech2>"],
  "linkedinUrl": "<url if confident>"
}
Only return the JSON object. Do not explain or add commentary.`;

export async function enrichLead(deps: Container, leadId: string): Promise<{ status: string }> {
  const { db, ai, logger } = deps;

  const rows = await db.query.leads.findFirst({
    where: (t, { eq }) => eq(t.id, leadId),
    columns: { id: true, name: true, email: true, company: true, enrichmentData: true },
  });

  if (!rows) return { status: 'skipped:not_found' };
  if (rows.enrichmentData) return { status: 'skipped:already_enriched' };
  if (!(await ai.isAvailable())) return { status: 'skipped:ai_not_configured' };

  let enriched: Partial<EnrichmentData> = {};

  try {
    const result = await ai.complete({
      kind: 'enrich_lead',
      messages: [{ role: 'user', content: ENRICHMENT_PROMPT({ name: rows.name, company: rows.company, email: rows.email }) }],
      maxTokens: 400,
    });

    // Extract JSON from response (Claude may wrap in markdown code fences)
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<EnrichmentData>;
      enriched = parsed;
    }
  } catch (err) {
    logger.warn({ err, leadId }, 'AI enrichment inference failed');
    // Fall through to save a minimal stub so we don't retry indefinitely
  }

  const data: EnrichmentData = {
    ...enriched,
    source: 'ai_inference',
    aiInferred: true,
    verifiedAt: new Date().toISOString(),
  };

  await db.transaction(async (tx) => {
    await updateLeadRow(tx, leadId, { enrichmentData: data });
  });

  logger.info({ leadId, source: data.source }, 'Lead enrichment saved');
  return { status: 'enriched' };
}
