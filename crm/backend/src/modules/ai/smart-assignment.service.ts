import { eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import { repSkills } from '../../db/schema/index.js';
import { findLeadById } from '../leads/leads.repository.js';
import type { RepSkillProfile } from '../../db/schema/ai.js';

export interface AssigneeSuggestion {
  userId: string;
  displayName: string;
  email: string;
  score: number;
  reasons: string[];
  currentLoad: number;
  winRate: number;
}

/** Score a rep against a lead 0-100. */
function scoreRepForLead(
  profile: RepSkillProfile,
  winRate: number,
  currentLoad: number,
  lead: { serviceInterest: string | null; company: string | null },
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Service interest match (40 pts)
  if (lead.serviceInterest && profile.serviceInterests?.includes(lead.serviceInterest)) {
    score += 40;
    reasons.push(`Specialises in ${lead.serviceInterest}`);
  } else if (profile.serviceInterests?.length) {
    score += 10;
  }

  // Win rate contribution (30 pts)
  const wr = Number(winRate) || 0;
  score += Math.round(wr * 30);
  if (wr >= 0.5) reasons.push(`${Math.round(wr * 100)}% recent win rate`);

  // Load penalty — reduce score for overloaded reps (up to -20 pts)
  const loadPenalty = Math.min(20, currentLoad * 2);
  score -= loadPenalty;
  if (loadPenalty > 0) reasons.push(`${currentLoad} active leads`);

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function createSmartAssignmentService(deps: Container) {
  return {
    async suggestAssignees(leadId: string): Promise<AssigneeSuggestion[]> {
      const lead = await findLeadById(deps.db, leadId);
      if (!lead) return [];

      // Fetch all available reps with their skill profiles and user info
      const rows = await deps.db
        .select()
        .from(repSkills)
        .where(eq(repSkills.isAvailable, true));

      if (rows.length === 0) return [];

      // Load user display names in one query
      const { users } = await import('../../db/schema/index.js');
      const userIds = rows.map((r) => r.userId);
      const userRows = await deps.db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userIds[0])); // placeholder; real query below

      // Fetch all users whose IDs appear in rep_skills
      const allUsers = await deps.db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users);

      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      void userRows; // reconcile type import

      const suggestions: AssigneeSuggestion[] = rows
        .map((rep) => {
          const user = userMap.get(rep.userId);
          if (!user) return null;

          const profile = (rep.profile ?? {}) as RepSkillProfile;
          const { score, reasons } = scoreRepForLead(
            profile,
            Number(rep.recentWinRate),
            rep.currentLeadLoad,
            lead,
          );

          return {
            userId: rep.userId,
            displayName: user.name,
            email: user.email,
            score,
            reasons,
            currentLoad: rep.currentLeadLoad,
            winRate: Number(rep.recentWinRate),
          } satisfies AssigneeSuggestion;
        })
        .filter((s): s is AssigneeSuggestion => s !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return suggestions;
    },

    /** Upsert a rep skill profile. Used by /users/:id/rep-skills endpoints. */
    async upsertRepSkills(
      userId: string,
      patch: Partial<{ profile: RepSkillProfile; isAvailable: boolean; currentLeadLoad: number; recentWinRate: number }>,
    ): Promise<void> {
      const existing = await deps.db
        .select({ id: repSkills.id })
        .from(repSkills)
        .where(eq(repSkills.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await deps.db
          .update(repSkills)
          .set({
            ...patch,
            recentWinRate: patch.recentWinRate != null ? String(patch.recentWinRate) : undefined,
            lastUpdatedAt: new Date(),
          })
          .where(eq(repSkills.userId, userId));
      } else {
        await deps.db.insert(repSkills).values({
          userId,
          profile: patch.profile ?? { industries: [], serviceInterests: [], countries: [], currentLeadLoad: 0, recentWinRate: 0 },
          isAvailable: patch.isAvailable ?? true,
          currentLeadLoad: patch.currentLeadLoad ?? 0,
          recentWinRate: String(patch.recentWinRate ?? 0),
        });
      }
    },

    async getRepSkills(userId: string) {
      const rows = await deps.db
        .select()
        .from(repSkills)
        .where(eq(repSkills.userId, userId))
        .limit(1);
      return rows[0] ?? null;
    },
  };
}
