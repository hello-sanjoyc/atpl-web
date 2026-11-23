import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import type { DbExecutor, Database } from '../../db/client.js';
import { leads } from '../../db/schema/index.js';
import type { AiClient } from './ai.client.js';
import type { AppLogger } from '../../logger/index.js';

export interface DuplicateMatch {
  leadId: string;
  candidateId: string;
  confidence: 'definite' | 'probable' | 'possible';
  reason: string;
}

/** Levenshtein distance (simple iterative impl, no deps). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeCompany(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|co|pvt|private|gmbh|sa|sas|bv|ag|plc|pty|aps)\b\.?/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function emailDomain(email: string): string {
  return email.split('@')[1] ?? '';
}

function isFreeMailProvider(domain: string): boolean {
  const FREE = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com'];
  return FREE.includes(domain.toLowerCase());
}

/** Heuristic similarity score 0-1 between two leads. */
function similarityScore(
  a: { email: string; company: string | null; phone: string | null },
  b: { email: string; company: string | null; phone: string | null },
): number {
  let score = 0;

  // Exact email → definite duplicate
  if (a.email === b.email) return 1;

  // Same email domain (non-free) is a strong signal
  const domainA = emailDomain(a.email);
  const domainB = emailDomain(b.email);
  if (domainA === domainB && !isFreeMailProvider(domainA)) score += 0.4;

  // Company name fuzzy match
  const compA = normalizeCompany(a.company);
  const compB = normalizeCompany(b.company);
  if (compA && compB) {
    const dist = levenshtein(compA, compB);
    const maxLen = Math.max(compA.length, compB.length);
    const companySim = maxLen > 0 ? 1 - dist / maxLen : 0;
    if (companySim >= 0.9) score += 0.4;
    else if (companySim >= 0.7) score += 0.2;
  }

  // Phone match
  const phoneA = normalizePhone(a.phone);
  const phoneB = normalizePhone(b.phone);
  if (phoneA && phoneB && phoneA === phoneB) score += 0.3;

  return Math.min(1, score);
}

/**
 * Checks a newly created lead against recent leads for duplicates.
 * Returns candidate matches sorted by confidence.
 */
export async function detectDuplicatesForLead(
  db: DbExecutor,
  leadId: string,
  ai: AiClient | null,
  logger: AppLogger,
): Promise<DuplicateMatch[]> {
  const [targetRow] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
    .limit(1);

  if (!targetRow) return [];

  // Pull recent leads (last 500 non-deleted) excluding itself
  const candidates = await db
    .select({ id: leads.id, email: leads.email, company: leads.company, phone: leads.phone })
    .from(leads)
    .where(and(isNull(leads.deletedAt), ne(leads.id, leadId)))
    .orderBy(sql`${leads.createdAt} desc`)
    .limit(500);

  const probable: Array<{ id: string; sim: number }> = [];
  for (const c of candidates) {
    const sim = similarityScore(
      { email: targetRow.email, company: targetRow.company, phone: targetRow.phone },
      { email: c.email, company: c.company, phone: c.phone },
    );
    if (sim >= 0.5) probable.push({ id: c.id, sim });
  }

  if (probable.length === 0) return [];

  // Sort and cap at top 10 for AI disambiguation
  probable.sort((a, b) => b.sim - a.sim);
  const top = probable.slice(0, 10);

  // For ambiguous matches (0.5–0.85) ask AI to decide
  const matches: DuplicateMatch[] = [];
  for (const { id: candidateId, sim } of top) {
    if (sim >= 0.95) {
      matches.push({ leadId, candidateId, confidence: 'definite', reason: 'High similarity on email domain, company and phone' });
      continue;
    }
    if (sim >= 0.75) {
      matches.push({ leadId, candidateId, confidence: 'probable', reason: 'Company name and domain match' });
      continue;
    }

    // Ambiguous — ask AI
    if (ai && (await ai.isAvailable())) {
      const candidateRow = candidates.find((c) => c.id === candidateId);
      if (candidateRow) {
        try {
          const result = await ai.complete({
            kind: 'dedup_lead',
            system: 'You are a data deduplication assistant. Given two leads, respond ONLY with JSON: {"duplicate": true|false, "confidence": "definite"|"probable"|"possible", "reason": "<string>"}',
            messages: [
              {
                role: 'user',
                content: JSON.stringify({
                  leadA: { email: targetRow.email, company: targetRow.company, phone: targetRow.phone },
                  leadB: { email: candidateRow.email, company: candidateRow.company, phone: candidateRow.phone },
                }),
              },
            ],
            maxTokens: 200,
          });
          const parsed = JSON.parse(result.text) as { duplicate: boolean; confidence: string; reason: string };
          if (parsed.duplicate) {
            matches.push({
              leadId,
              candidateId,
              confidence: (parsed.confidence as DuplicateMatch['confidence']) ?? 'possible',
              reason: parsed.reason,
            });
          }
        } catch (err) {
          logger.warn({ leadId, candidateId, err }, 'AI dedup call failed, using heuristic');
          matches.push({ leadId, candidateId, confidence: 'possible', reason: 'Similarity score above threshold' });
        }
      }
    } else {
      matches.push({ leadId, candidateId, confidence: 'possible', reason: 'Similarity score above threshold' });
    }
  }

  return matches;
}

/**
 * Assigns a shared `duplicate_group_id` to a lead and its confirmed duplicates.
 * Uses the existing group if one already exists, otherwise creates a new one.
 */
export async function assignDuplicateGroup(
  db: DbExecutor,
  leadId: string,
  duplicateIds: string[],
): Promise<string> {
  if (duplicateIds.length === 0) return leadId;

  // Find if any existing duplicate has a group already
  const existing = await db
    .select({ duplicateGroupId: leads.duplicateGroupId })
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
    .limit(1);

  const groupId = existing[0]?.duplicateGroupId ?? leadId;

  const allIds = [leadId, ...duplicateIds];
  for (const id of allIds) {
    await db
      .update(leads)
      .set({ duplicateGroupId: groupId, updatedAt: new Date() })
      .where(eq(leads.id, id));
  }

  return groupId;
}

/** Bulk deduplication job — scans all live leads and assigns groups. Meant to run once at migration. */
export async function runBulkDedup(db: Database, ai: AiClient | null, logger: AppLogger): Promise<{ processed: number; grouped: number }> {
  logger.info('Starting bulk duplicate detection scan');

  const allLeads = await db
    .select({ id: leads.id, email: leads.email, company: leads.company, phone: leads.phone })
    .from(leads)
    .where(isNull(leads.deletedAt))
    .orderBy(sql`${leads.createdAt} asc`);

  let grouped = 0;
  const processed = allLeads.length;
  const seen = new Set<string>();

  for (const lead of allLeads) {
    if (seen.has(lead.id)) continue;

    const matches = await detectDuplicatesForLead(db, lead.id, ai, logger);
    const definiteDups = matches.filter((m) => m.confidence === 'definite' || m.confidence === 'probable').map((m) => m.candidateId);

    if (definiteDups.length > 0) {
      await assignDuplicateGroup(db, lead.id, definiteDups);
      definiteDups.forEach((id) => seen.add(id));
      grouped += definiteDups.length + 1;
      logger.info({ leadId: lead.id, duplicates: definiteDups.length }, 'Duplicate group assigned');
    }
  }

  logger.info({ processed, grouped }, 'Bulk dedup scan complete');
  return { processed, grouped };
}
