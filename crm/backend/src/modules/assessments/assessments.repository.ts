import { and, asc, eq } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { assessmentSubmissions, assessments } from '../../db/schema/index.js';

export type AssessmentRow = typeof assessments.$inferSelect;

export async function listActiveAssessments(db: DbExecutor): Promise<AssessmentRow[]> {
  return withDbTiming('assessments.list', () =>
    db.select().from(assessments).where(eq(assessments.isActive, true)).orderBy(asc(assessments.title)),
  );
}

export async function findActiveAssessmentBySlug(db: DbExecutor, slug: string): Promise<AssessmentRow | undefined> {
  const [row] = await withDbTiming('assessments.find', () =>
    db
      .select()
      .from(assessments)
      .where(and(eq(assessments.slug, slug), eq(assessments.isActive, true)))
      .limit(1),
  );
  return row;
}

export async function insertSubmission(
  db: DbExecutor,
  values: { assessmentId: string; leadId: string; score: number; band: string; answers: Record<string, string> },
): Promise<void> {
  await withDbTiming('assessments.submission.insert', () => db.insert(assessmentSubmissions).values(values));
}
