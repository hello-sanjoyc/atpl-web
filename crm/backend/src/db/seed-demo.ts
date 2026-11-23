import { pathToFileURL } from 'node:url';
import { and, eq, like, sql } from 'drizzle-orm';
import { loadConfig } from '../config/env.js';
import { ROLES, LEAD_STAGES, OPPORTUNITY_STAGES, LOST_REASONS, type Role } from '../config/constants.js';
import { createContainer } from '../container.js';
import { hashPassword } from '../utils/password.js';
import { seedReferenceData } from './seed.js';
import { assertSafeDatabaseHost, assertNotProtected, DEMO_EMAIL_DOMAIN } from './seed-demo.safety.js';
import {
  users,
  campaigns,
  referrals,
  leads,
  opportunities,
  customers,
  contacts,
  contracts,
  revenueRecords,
  followUpTasks,
  optionItems,
} from './schema/index.js';
import type { Database } from './client.js';

/**
 * Deterministic demo-data seed. Every row is index-derived (no PRNG), so repeated runs against an
 * empty or already-seeded database produce byte-identical output. All relative dates are computed
 * from a fixed anchor, not `Date.now()`, so output never changes based on when the script runs.
 */
const ANCHOR = new Date('2026-11-01T00:00:00Z');

const DEMO_PASSWORD = 'Demo-Pass-2026!';

const FIRST_NAMES = ['Asha', 'Rohan', 'Maya', 'Vikram', 'Priya', 'Arjun', 'Neha', 'Karan', 'Divya', 'Sahil', 'Ritu', 'Aman'];
const LAST_NAMES = ['Sharma', 'Verma', 'Iyer', 'Gupta', 'Khan', 'Nair', 'Reddy', 'Kapoor', 'Joshi', 'Malhotra', 'Bose', 'Chawla'];
const COMPANY_WORDS = ['Northwind', 'Bluepeak', 'Vertex', 'Orbital', 'Crescent', 'Ironclad', 'Lumen', 'Granite', 'Solstice', 'Meridian', 'Hearth', 'Anchorpoint', 'Fieldstone', 'Quartz', 'Harborlight'];
const COMPANY_SUFFIXES = ['Technologies', 'Retail Group', 'Healthcare', 'Education', 'Manufacturing', 'Properties', 'Logistics', 'Financial', 'Hospitality', 'Consulting'];
const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Delhi', 'Gurugram', 'Kolkata', 'Ahmedabad', 'Jaipur'];
const CHANNELS = ['google_ads', 'linkedin', 'email', 'event', 'content'];

function roleSlug(role: string): string {
  return role.replace(/_/g, '-');
}

function demoUserEmail(role: string, n: number): string {
  return `demo.${roleSlug(role)}.${n}@${DEMO_EMAIL_DOMAIN}`;
}

function fullName(i: number): string {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;
}

function companyName(i: number): string {
  return `${COMPANY_WORDS[i % COMPANY_WORDS.length]} ${COMPANY_SUFFIXES[(i * 5) % COMPANY_SUFFIXES.length]}`;
}

function daysFromAnchor(days: number): Date {
  return new Date(ANCHOR.getTime() + days * 86_400_000);
}

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface OptionValues {
  service_interest: string[];
  budget_range: string[];
  timeline: string[];
  capture_channel: string[];
  lead_source: string[];
  opportunity_type: string[];
  contract_kind: string[];
}

async function loadOptionValues(db: Database): Promise<OptionValues> {
  const categories = ['service_interest', 'budget_range', 'timeline', 'capture_channel', 'lead_source', 'opportunity_type', 'contract_kind'] as const;
  const result = {} as OptionValues;
  for (const category of categories) {
    const rows = await db
      .select({ value: optionItems.value })
      .from(optionItems)
      .where(and(eq(optionItems.category, category), eq(optionItems.isActive, true)));
    result[category] = rows.map((r) => r.value);
    if (result[category].length === 0) {
      throw new Error(`No active option_items found for category "${category}" — run reference-data seeding first.`);
    }
  }
  return result;
}

async function seedUsers(db: Database): Promise<Record<Role, string[]>> {
  const ids: Record<string, string[]> = {};
  let i = 0;
  for (const role of ROLES) {
    ids[role] = [];
    for (let n = 1; n <= 2; n++) {
      const email = demoUserEmail(role, n);
      const name = `${fullName(i)} (${role.replace(/_/g, ' ')})`;
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (existing[0]) {
        await db.update(users).set({ name, role, isActive: true }).where(eq(users.id, existing[0].id));
        ids[role].push(existing[0].id);
      } else {
        const [row] = await db
          .insert(users)
          .values({ email, name, role, passwordHash: await hashPassword(DEMO_PASSWORD), isActive: true })
          .returning({ id: users.id });
        ids[role].push(row!.id);
      }
      i++;
    }
  }
  return ids as Record<Role, string[]>;
}

async function seedCampaigns(db: Database, ownerIds: string[]): Promise<string[]> {
  const statuses = ['active', 'paused', 'ended'] as const;
  const ids: string[] = [];
  for (let i = 0; i < 18; i++) {
    const status = statuses[i % statuses.length]!;
    const slug = `demo-campaign-${String(i + 1).padStart(2, '0')}`;
    const [row] = await db
      .insert(campaigns)
      .values({
        name: `[Demo] ${companyName(i)} ${CHANNELS[i % CHANNELS.length]} campaign`,
        slug,
        channel: CHANNELS[i % CHANNELS.length]!,
        status,
        startsOn: dateString(daysFromAnchor(-180 + i * 5)),
        endsOn: status === 'ended' ? dateString(daysFromAnchor(-30 + i)) : null,
        createdBy: ownerIds[i % ownerIds.length],
      })
      .onConflictDoUpdate({ target: campaigns.slug, set: { status } })
      .returning({ id: campaigns.id });
    ids.push(row!.id);
  }
  return ids;
}

async function seedReferrals(db: Database): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 15; i++) {
    const code = `DEMO-REF-${String(i + 1).padStart(3, '0')}`;
    const referrerName = fullName(i + 50);
    const existing = await db.select({ id: referrals.id }).from(referrals).where(eq(referrals.code, code));
    if (existing[0]) {
      await db.update(referrals).set({ referrerName }).where(eq(referrals.id, existing[0].id));
      ids.push(existing[0].id);
    } else {
      const [row] = await db
        .insert(referrals)
        .values({ code, referrerName, referrerEmail: `referrer${i + 1}@${DEMO_EMAIL_DOMAIN}` })
        .returning({ id: referrals.id });
      ids.push(row!.id);
    }
  }
  return ids;
}

async function seedLeads(
  db: Database,
  options: OptionValues,
  ownerIds: string[],
  campaignIds: string[],
  referralIds: string[],
): Promise<string[]> {
  const priorities = ['low', 'medium', 'high'] as const;
  const qualifications = ['unqualified', 'qualified', 'disqualified'] as const;
  const ids: string[] = [];

  for (let i = 0; i < 75; i++) {
    const email = `demo.lead.${i + 1}@${DEMO_EMAIL_DOMAIN}`;
    const stage = LEAD_STAGES[i % LEAD_STAGES.length]!.key;
    const priority = priorities[i % priorities.length];
    // Weighted distribution: ~50% unqualified, ~35% qualified, ~15% disqualified.
    const qualificationStatus = i % 20 < 10 ? qualifications[0] : i % 20 < 17 ? qualifications[1] : qualifications[2];
    const hasCampaign = i % 3 === 0;
    const hasReferral = !hasCampaign && i % 5 === 0;

    const values = {
      email,
      name: fullName(i),
      phone: `+91 98${String(10000000 + i).slice(0, 8)}`,
      company: companyName(i),
      country: 'IN',
      serviceInterest: options.service_interest[i % options.service_interest.length],
      budgetRange: options.budget_range[i % options.budget_range.length],
      timeline: options.timeline[i % options.timeline.length],
      message: `Interested in learning more about ${options.service_interest[i % options.service_interest.length]} for ${companyName(i)}.`,
      captureChannel: options.capture_channel[i % options.capture_channel.length],
      leadSource: options.lead_source[i % options.lead_source.length],
      source: options.lead_source[i % options.lead_source.length]!,
      formSource: 'demo-seed',
      campaignId: hasCampaign ? campaignIds[i % campaignIds.length] : null,
      referralId: hasReferral ? referralIds[i % referralIds.length] : null,
      stage,
      priority,
      score: (i * 7) % 101,
      qualificationStatus,
      ownerId: ownerIds[i % ownerIds.length],
      privacyPolicyVersion: '1.0',
      consentRecordedAt: daysFromAnchor(-90 + i),
    };
    const existing = await db.select({ id: leads.id }).from(leads).where(eq(leads.email, email));
    if (existing[0]) {
      await db.update(leads).set({ stage, priority, qualificationStatus }).where(eq(leads.id, existing[0].id));
      ids.push(existing[0].id);
    } else {
      const [row] = await db.insert(leads).values(values).returning({ id: leads.id });
      ids.push(row!.id);
    }
  }
  return ids;
}

async function seedOpportunities(
  db: Database,
  options: OptionValues,
  ownerIds: string[],
  leadIds: string[],
  campaignIds: string[],
): Promise<string[]> {
  const ids: string[] = [];
  const stageDefaults = new Map<string, string>(OPPORTUNITY_STAGES.map((s) => [s.key, s.probability]));
  const currencies = ['INR', 'USD', 'EUR'] as const;

  for (let i = 0; i < 28; i++) {
    const title = `[Demo] Opportunity ${i + 1}`;
    const ownerId = ownerIds[i % ownerIds.length]!;

    const existing = await db.select({ id: opportunities.id }).from(opportunities).where(and(eq(opportunities.title, title), eq(opportunities.ownerId, ownerId)));

    let stage: string;
    let status: 'open' | 'won' | 'lost';
    let wonValue: string | null = null;
    let wonAt: Date | null = null;
    let lostAt: Date | null = null;
    let lostReason: string | null = null;
    const estimatedValue = String(50_000 + i * 15_000);

    if (i < 6) {
      stage = 'won';
      status = 'won';
      wonValue = estimatedValue;
      wonAt = daysFromAnchor(-10 - i);
    } else if (i < 11) {
      stage = 'lost';
      status = 'lost';
      lostAt = daysFromAnchor(-15 - i);
      lostReason = LOST_REASONS[i % LOST_REASONS.length]!;
    } else {
      const openStages = ['discovery', 'proposal_sent', 'negotiation'] as const;
      stage = openStages[i % openStages.length];
      status = 'open';
    }

    const values = {
      leadId: i % 2 === 0 ? leadIds[i % leadIds.length] : null,
      campaignId: i % 4 === 0 ? campaignIds[i % campaignIds.length] : null,
      ownerId,
      title,
      serviceInterest: options.service_interest[i % options.service_interest.length],
      country: 'IN',
      opportunityType: options.opportunity_type[i % options.opportunity_type.length]!,
      stage,
      status,
      probability: stageDefaults.get(stage) ?? '0.2000',
      estimatedValue,
      currency: currencies[i % currencies.length],
      expectedCloseDate: dateString(daysFromAnchor(20 + i * 3)),
      wonValue,
      wonAt,
      lostAt,
      lostReason,
    };

    if (existing[0]) {
      await db.update(opportunities).set(values).where(eq(opportunities.id, existing[0].id));
      ids.push(existing[0].id);
    } else {
      const [row] = await db.insert(opportunities).values(values).returning({ id: opportunities.id });
      ids.push(row!.id);
    }
  }
  return ids;
}

async function seedCustomers(db: Database, leadIds: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 18; i++) {
    const email = `demo.customer.${i + 1}@${DEMO_EMAIL_DOMAIN}`;
    const status = i % 20 < 17 ? 'active' : 'churned';
    const values = {
      name: fullName(i + 100),
      company: companyName(i + 20),
      email,
      phone: `+91 99${String(20000000 + i).slice(0, 8)}`,
      country: 'IN',
      status,
      sourceLeadId: i % 2 === 0 ? leadIds[i % leadIds.length] : null,
      churnedAt: status === 'churned' ? daysFromAnchor(-20 - i) : null,
    };
    const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email));
    if (existing[0]) {
      await db.update(customers).set(values).where(eq(customers.id, existing[0].id));
      ids.push(existing[0].id);
    } else {
      const [row] = await db.insert(customers).values(values).returning({ id: customers.id });
      ids.push(row!.id);
    }
  }
  return ids;
}

async function seedContactsAndContracts(db: Database, options: OptionValues, customerIds: string[]): Promise<void> {
  for (let i = 0; i < customerIds.length; i++) {
    const customerId = customerIds[i]!;
    const existingContacts = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.customerId, customerId));
    if (existingContacts.length === 0) {
      await db.insert(contacts).values({
        customerId,
        name: fullName(i + 200),
        email: `demo.contact.${i + 1}@${DEMO_EMAIL_DOMAIN}`,
        role: 'Primary contact',
        isPrimary: true,
      });
    }

    if (i % 5 < 3) {
      const existingContracts = await db.select({ id: contracts.id }).from(contracts).where(eq(contracts.customerId, customerId));
      if (existingContracts.length === 0) {
        await db.insert(contracts).values({
          customerId,
          name: `[Demo] Contract ${i + 1}`,
          kind: options.contract_kind[i % options.contract_kind.length]!,
          value: String(100_000 + i * 10_000),
          currency: 'INR',
          startsOn: dateString(daysFromAnchor(-200 + i * 4)),
          renewsOn: dateString(daysFromAnchor(165 + i * 4)),
          status: i % 7 === 0 ? 'ended' : 'active',
        });
      }
    }
  }
}

async function seedRevenueRecords(db: Database, customerIds: string[], opportunityIds: string[]): Promise<void> {
  await db.delete(revenueRecords).where(like(revenueRecords.reference, 'DEMO-REV-%'));
  for (let i = 0; i < 25; i++) {
    const monthsAgo = i % 12;
    await db.insert(revenueRecords).values({
      customerId: customerIds[i % customerIds.length],
      opportunityId: i % 2 === 0 ? opportunityIds[i % opportunityIds.length] : null,
      kind: i % 2 === 0 ? 'invoiced' : 'collected',
      amount: String(25_000 + i * 3_000),
      currency: 'INR',
      recognizedOn: dateString(daysFromAnchor(-monthsAgo * 30 - (i % 28))),
      reference: `DEMO-REV-${String(i + 1).padStart(3, '0')}`,
    });
  }
}

async function seedFollowUpTasks(
  db: Database,
  userIds: string[],
  leadIds: string[],
  opportunityIds: string[],
  customerIds: string[],
): Promise<void> {
  await db.delete(followUpTasks).where(like(followUpTasks.title, '[Demo]%'));
  for (let i = 0; i < 20; i++) {
    let dueAt: Date;
    let status: 'open' | 'completed' | 'cancelled';
    let completedAt: Date | null = null;

    if (i < 5) {
      dueAt = daysFromAnchor(-(i + 1) * 2);
      status = 'open';
    } else if (i < 13) {
      dueAt = daysFromAnchor(-(i + 1));
      status = 'completed';
      completedAt = daysFromAnchor(-(i));
    } else {
      dueAt = daysFromAnchor((i - 12) * 2);
      status = 'open';
    }

    await db.insert(followUpTasks).values({
      leadId: i % 3 === 0 ? leadIds[i % leadIds.length] : null,
      opportunityId: i % 3 === 1 ? opportunityIds[i % opportunityIds.length] : null,
      customerId: i % 3 === 2 ? customerIds[i % customerIds.length] : null,
      ownerId: userIds[i % userIds.length]!,
      title: `[Demo] Follow up on ${i % 3 === 1 ? 'opportunity' : i % 3 === 2 ? 'customer account' : 'lead'} ${i + 1}`,
      dueAt,
      status,
      completedAt,
    });
  }
}

async function runSeed(db: Database): Promise<void> {
  await seedReferenceData(db);
  const options = await loadOptionValues(db);

  const usersByRole = await seedUsers(db);
  const allUserIds = Object.values(usersByRole).flat();

  const campaignIds = await seedCampaigns(db, allUserIds);
  const referralIds = await seedReferrals(db);
  const leadIds = await seedLeads(db, options, allUserIds, campaignIds, referralIds);
  const opportunityIds = await seedOpportunities(db, options, allUserIds, leadIds, campaignIds);
  const customerIds = await seedCustomers(db, leadIds);
  await seedContactsAndContracts(db, options, customerIds);
  await seedRevenueRecords(db, customerIds, opportunityIds);
  await seedFollowUpTasks(db, allUserIds, leadIds, opportunityIds, customerIds);

  console.log('Demo data seeded:');
  console.log(`  users: ${allUserIds.length}`);
  console.log(`  campaigns: ${campaignIds.length}`);
  console.log(`  referrals: ${referralIds.length}`);
  console.log(`  leads: ${leadIds.length}`);
  console.log(`  opportunities: ${opportunityIds.length}`);
  console.log(`  customers: ${customerIds.length}`);
  console.log(`Credentials written to backend/.demo-credentials.json (password not logged).`);

  const fs = await import('node:fs/promises');
  const credentials = {
    password: DEMO_PASSWORD,
    users: Object.entries(usersByRole).flatMap(([role, ids]) =>
      ids.map((_, n) => ({ role, email: demoUserEmail(role, n + 1) })),
    ),
  };
  await fs.writeFile(new URL('../../.demo-credentials.json', import.meta.url), JSON.stringify(credentials, null, 2));
}

async function runCleanup(db: Database): Promise<void> {
  const domainPattern = `%@${DEMO_EMAIL_DOMAIN}`;

  await db.delete(followUpTasks).where(like(followUpTasks.title, '[Demo]%'));
  await db.delete(revenueRecords).where(like(revenueRecords.reference, 'DEMO-REV-%'));
  // contacts/contracts cascade from customers.
  await db.delete(customers).where(like(customers.email, domainPattern));
  await db.delete(opportunities).where(like(opportunities.title, '[Demo] Opportunity%'));
  await db.delete(leads).where(like(leads.email, domainPattern));
  await db.delete(referrals).where(like(referrals.code, 'DEMO-REF-%'));
  await db.delete(campaigns).where(like(campaigns.slug, 'demo-campaign-%'));

  const demoUsers = await db.select({ email: users.email }).from(users).where(like(users.email, domainPattern));
  for (const u of demoUsers) assertNotProtected(u.email);
  await db.delete(users).where(like(users.email, domainPattern));

  console.log('Demo data cleaned up.');
}

async function main(): Promise<void> {
  const config = loadConfig();
  assertSafeDatabaseHost(config);
  const container = createContainer(config);
  const { db } = container;
  try {
    if (process.argv.includes('--cleanup')) {
      await runCleanup(db);
    } else {
      await runSeed(db);
    }
  } finally {
    await container.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`Demo seed failed: ${(error as Error).message}\n`);
    process.exit(1);
  });
}
