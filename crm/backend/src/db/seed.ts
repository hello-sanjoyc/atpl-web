import { pathToFileURL } from 'node:url';
import { loadConfig } from '../config/env.js';
import { LEAD_STAGES, OPPORTUNITY_STAGES } from '../config/constants.js';
import { createContainer } from '../container.js';
import { ASSESSMENT_CATALOG } from '../modules/assessments/assessment.catalog.js';
import { insertUser, findUserByEmail } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { assessments, leadStages, opportunityStages } from './schema/index.js';

/**
 * Idempotent reference-data seed: lead stages, opportunity stages and the assessment catalog.
 * An initial admin is created only when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are both set and
 * no user with that email exists. Nothing here generates business records.
 */
import type { Database } from './client.js';

/** Inserts or updates lead stages, opportunity stages and the assessment catalog. Safe to run repeatedly. */
export async function seedReferenceData(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    for (const stage of LEAD_STAGES) {
      await tx
        .insert(leadStages)
        .values({ key: stage.key, name: stage.name, position: stage.position, isTerminal: stage.terminal })
        .onConflictDoUpdate({ target: leadStages.key, set: { name: stage.name, position: stage.position, isTerminal: stage.terminal } });
    }
    for (const stage of OPPORTUNITY_STAGES) {
      await tx
        .insert(opportunityStages)
        .values({
          key: stage.key,
          name: stage.name,
          position: stage.position,
          defaultProbability: stage.probability,
          isTerminal: stage.terminal,
        })
        .onConflictDoUpdate({
          target: opportunityStages.key,
          set: { name: stage.name, position: stage.position, defaultProbability: stage.probability, isTerminal: stage.terminal },
        });
    }
    for (const definition of ASSESSMENT_CATALOG) {
      await tx
        .insert(assessments)
        .values({
          slug: definition.slug,
          title: definition.title,
          description: definition.description,
          questions: definition.questions,
          bands: definition.bands,
        })
        .onConflictDoUpdate({
          target: assessments.slug,
          set: { title: definition.title, description: definition.description, questions: definition.questions, bands: definition.bands },
        });
    }
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  const { db } = container;
  try {
    await seedReferenceData(db);

    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      if (adminPassword.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
      const existing = await findUserByEmail(db, adminEmail);
      if (!existing) {
        await insertUser(db, {
          email: adminEmail,
          name: 'Initial Administrator',
          role: 'super_admin',
          passwordHash: await hashPassword(adminPassword),
        });
        container.logger.info({ event: 'seed.admin_created' }, 'Initial administrator created');
      }
    }
    container.logger.info({ event: 'seed.completed', leadStages: LEAD_STAGES.length, opportunityStages: OPPORTUNITY_STAGES.length, assessments: ASSESSMENT_CATALOG.length }, 'Reference data seeded');
  } finally {
    await container.close();
  }
}


if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`Seed failed: ${(error as Error).message}\n`);
    process.exit(1);
  });
}
