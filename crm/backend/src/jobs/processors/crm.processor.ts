import type { Container } from '../../container.js';
import { crmSyncRecords } from '../../db/schema/index.js';
import { findLeadById } from '../../modules/leads/leads.repository.js';
import type { OutboxRecord } from '../queues/outbox.repository.js';
import type { ProcessOutcome } from './dispatcher.js';

/**
 * Pushes a lead to the configured CRM. With no adapter configured the outcome is an explicit,
 * recorded "skipped" with reason crm_disabled. It is never reported as synced.
 */
export async function processCrmEvent(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  const lead = await findLeadById(deps.db, String(event.payload.leadId));
  if (!lead) return { status: 'skipped', reason: 'lead_not_found' };

  if (!deps.crm) {
    await deps.db.insert(crmSyncRecords).values({
      leadId: lead.id,
      provider: 'none',
      status: 'skipped',
      attempts: event.attempts,
      lastErrorCode: 'crm_disabled',
    });
    return { status: 'skipped', reason: 'crm_disabled' };
  }

  try {
    const result = await deps.crm.upsertLead({
      leadId: lead.id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      stage: lead.stage,
    });
    await deps.db.insert(crmSyncRecords).values({
      leadId: lead.id,
      provider: deps.crm.name,
      externalId: result.externalId,
      status: 'synced',
      attempts: event.attempts,
    });
    return { status: 'sent', reference: result.externalId };
  } catch (error) {
    await deps.db.insert(crmSyncRecords).values({
      leadId: lead.id,
      provider: deps.crm.name,
      status: 'failed',
      attempts: event.attempts,
      lastErrorCode: (error as { code?: string }).code ?? 'crm_sync_failed',
    });
    throw error;
  }
}
