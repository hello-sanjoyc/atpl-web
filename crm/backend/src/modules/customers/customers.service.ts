import { RENEWAL_REMINDER_WINDOW_DAYS, EVENT_TYPES } from '../../config/constants.js';
import type { Container } from '../../container.js';
import type { Transaction } from '../../db/client.js';
import { NotFoundError, ConflictError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { enqueueOutboxEvent } from '../../jobs/queues/outbox.repository.js';
import type { AuthUser } from '../../types/fastify.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import type { LeadRow } from '../leads/leads.repository.js';
import { findOpportunityById } from '../opportunities/opportunities.repository.js';
import { listRevenueForCustomer } from '../revenue/revenue.repository.js';
import {
  findContractById,
  findCustomerById,
  findCustomerByEmail,
  insertContact,
  insertContract,
  insertCustomer,
  listContacts,
  listContractsForCustomer,
  listCustomers,
  listRenewalsDue,
  markRenewalReminded,
  updateCustomer,
  type CustomerRow,
} from './customers.repository.js';
import { listOpportunitiesForCustomer } from '../opportunities/opportunities.repository.js';

/**
 * Converts a won lead into a customer. Reuses an existing customer with the same email so that a
 * returning client is never duplicated. Must run in the caller's transaction.
 */
export async function ensureCustomerForLead(tx: Transaction, lead: LeadRow, actorId: string | null): Promise<CustomerRow> {
  const existing = await findCustomerByEmail(tx, lead.email);
  if (existing) return existing;
  const created = await insertCustomer(tx, {
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    sourceLeadId: lead.id,
    referralId: lead.referralId,
    campaignId: lead.campaignId,
  });
  await recordAudit(tx, {
    actorId,
    action: 'customer.created_from_lead',
    entityType: 'customer',
    entityId: created.id,
    metadata: { sourceLeadId: lead.id },
  });
  return created;
}

export function createCustomersService(deps: Container) {
  const { db, logger, now, config } = deps;
  const log = logger.child({ module: 'customers' });

  async function requireCustomer(id: string): Promise<CustomerRow> {
    const row = await findCustomerById(db, id);
    if (!row) throw new NotFoundError(ErrorCodes.CUSTOMER_NOT_FOUND, 'The requested customer was not found.');
    return row;
  }

  return {
    async list(query: { q?: string; status?: string; page: number; pageSize: number }) {
      const { rows, total } = await listCustomers(db, {
        q: query.q,
        status: query.status,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return { items: rows, page: pagination(query.page, query.pageSize, total) };
    },

    async create(actor: AuthUser, input: { name: string; company?: string; email: string; phone?: string; country?: string; sourceLeadId?: string }) {
      const email = input.email.toLowerCase();
      if (await findCustomerByEmail(db, email)) throw new ConflictError(ErrorCodes.CONFLICT, 'A customer with this email already exists.');
      const row = await db.transaction(async (tx) => {
        const created = await insertCustomer(tx, { ...input, email, phone: input.phone ?? null, company: input.company ?? null, country: input.country ?? null, sourceLeadId: input.sourceLeadId ?? null });
        await recordAudit(tx, { actorId: actor.id, action: 'customer.created', entityType: 'customer', entityId: created.id });
        return created;
      });
      log.info({ event: 'customer.created', customerId: row.id, actorUserId: actor.id }, 'Customer created');
      return row;
    },

    async get(id: string) {
      const customer = await requireCustomer(id);
      const [contactRows, contractRows, opportunityRows] = await Promise.all([
        listContacts(db, id),
        listContractsForCustomer(db, id),
        listOpportunitiesForCustomer(db, id),
      ]);
      return { customer, contacts: contactRows, contracts: contractRows, opportunities: opportunityRows };
    },

    async update(actor: AuthUser, id: string, patch: { name?: string; company?: string | null; phone?: string | null; country?: string | null; status?: 'active' | 'churned' }) {
      const current = await requireCustomer(id);
      const churnedAt = patch.status === 'churned' && current.status !== 'churned' ? now() : patch.status === 'active' ? null : undefined;
      const row = await db.transaction(async (tx) => {
        const updated = await updateCustomer(tx, id, { ...patch, ...(churnedAt !== undefined ? { churnedAt } : {}) });
        await recordAudit(tx, { actorId: actor.id, action: 'customer.updated', entityType: 'customer', entityId: id, metadata: { fields: Object.keys(patch) } });
        return updated;
      });
      return row;
    },

    async addContact(actor: AuthUser, customerId: string, input: { name: string; email?: string; phone?: string; role?: string; isPrimary: boolean }) {
      await requireCustomer(customerId);
      return db.transaction(async (tx) => {
        const row = await insertContact(tx, { ...input, customerId, email: input.email?.toLowerCase() ?? null, phone: input.phone ?? null, role: input.role ?? null });
        await recordAudit(tx, { actorId: actor.id, action: 'contact.created', entityType: 'contact', entityId: row.id, metadata: { customerId } });
        return row;
      });
    },

    async addContract(actor: AuthUser, customerId: string, input: {
      opportunityId?: string; name: string; kind: string; value: string; currency: string; startsOn: string; renewsOn?: string;
    }) {
      await deps.options.validateFields(input, { kind: 'contract_kind' });
      await requireCustomer(customerId);
      if (input.opportunityId && !(await findOpportunityById(db, input.opportunityId))) {
        throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The linked opportunity was not found.');
      }
      return db.transaction(async (tx) => {
        const row = await insertContract(tx, { ...input, customerId, opportunityId: input.opportunityId ?? null, renewsOn: input.renewsOn ?? null });
        await recordAudit(tx, {
          actorId: actor.id,
          action: 'contract.created',
          entityType: 'contract',
          entityId: row.id,
          metadata: { customerId, kind: input.kind, currency: input.currency },
        });
        return row;
      });
    },

    async history(id: string) {
      await requireCustomer(id);
      const [opps, revenue] = await Promise.all([listOpportunitiesForCustomer(db, id), listRevenueForCustomer(db, id)]);
      return {
        opportunities: opps.map((o) => ({ id: o.id, title: o.title, stage: o.stage, status: o.status, wonValue: o.wonValue, currency: o.currency, updatedAt: o.updatedAt.toISOString() })),
        revenue: revenue.map((r) => ({ id: r.id, kind: r.kind, amount: r.amount, currency: r.currency, recognizedOn: r.recognizedOn })),
      };
    },

    async listRenewals(withinDays: number) {
      const today = now();
      const until = new Date(today.getTime() + withinDays * 86_400_000);
      return listRenewalsDue(db, {
        renewsOnOrAfter: today.toISOString().slice(0, 10),
        renewsOnOrBefore: until.toISOString().slice(0, 10),
      });
    },

    /**
     * Enqueues a renewal reminder for each contract entering the reminder window, once per contract.
     * Called from the scheduler; the reminder goes to internal sales staff, not the customer.
     */
    async enqueueRenewalReminders(at: Date): Promise<number> {
      const until = new Date(at.getTime() + RENEWAL_REMINDER_WINDOW_DAYS * 86_400_000);
      const due = await listRenewalsDue(db, {
        renewsOnOrAfter: at.toISOString().slice(0, 10),
        renewsOnOrBefore: until.toISOString().slice(0, 10),
        onlyUnreminded: true,
      });
      if (!config.SALES_NOTIFICATION_EMAIL) {
        if (due.length > 0) log.warn({ event: 'job.skipped', reason: 'SALES_NOTIFICATION_EMAIL not set', count: due.length }, 'Renewal reminders deferred');
        return 0;
      }
      for (const contract of due) {
        await db.transaction(async (tx) => {
          await enqueueOutboxEvent(tx, {
            type: EVENT_TYPES.EMAIL_RENEWAL,
            aggregateType: 'contract',
            aggregateId: contract.id,
            payload: { contractId: contract.id },
            maxAttempts: config.OUTBOX_MAX_ATTEMPTS,
          });
          await markRenewalReminded(tx, contract.id, at);
        });
      }
      return due.length;
    },

    async getContract(id: string) {
      const row = await findContractById(db, id);
      if (!row) throw new NotFoundError(ErrorCodes.CONTRACT_NOT_FOUND, 'The requested contract was not found.');
      return row;
    },
  };
}
