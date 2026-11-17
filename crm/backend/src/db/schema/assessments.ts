import { sql } from 'drizzle-orm';
import { boolean, check, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps, tstz } from './common.js';
import { leads } from './leads.js';

export interface AssessmentQuestion {
  id: string;
  label: string;
  options: Array<{ value: string; label: string; points: number }>;
}

export interface AssessmentBand {
  key: string;
  label: string;
  min: number;
  recommendation: string;
}

export const assessments = pgTable(
  'assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    version: integer('version').notNull().default(1),
    questions: jsonb('questions').$type<AssessmentQuestion[]>().notNull(),
    bands: jsonb('bands').$type<AssessmentBand[]>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('assessments_slug_uq').on(t.slug), check('assessments_version_chk', sql`${t.version} >= 1`)],
);

export const assessmentSubmissions = pgTable('assessment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'restrict' }),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  band: text('band').notNull(),
  answers: jsonb('answers').$type<Record<string, string>>().notNull(),
  createdAt: tstz('created_at').notNull().defaultNow(),
});
