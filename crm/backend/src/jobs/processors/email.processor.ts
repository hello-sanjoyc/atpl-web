import { eq } from 'drizzle-orm';
import { ASSESSMENT_CATALOG } from '../../modules/assessments/assessment.catalog.js';
import { EVENT_TYPES, ACKNOWLEDGEMENT_TEMPLATES } from '../../config/constants.js';
import type { Container } from '../../container.js';
import { ExternalServiceError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { fingerprint } from '../../logger/correlation.js';
import { emailDeliveryLogs } from '../../db/schema/index.js';
import { findCustomerById, findContractById } from '../../modules/customers/customers.repository.js';
import { findLeadById } from '../../modules/leads/leads.repository.js';
import { renderTemplate, type TemplateData, type TemplateName } from '../../modules/email/templates.js';
import type { OutboxRecord } from '../queues/outbox.repository.js';
import { PermanentJobError, type ProcessOutcome } from './dispatcher.js';

const TEMPLATE_FOR_EVENT: Record<string, TemplateName> = {
  [EVENT_TYPES.EMAIL_ACK]: ACKNOWLEDGEMENT_TEMPLATES.LEAD,
  [EVENT_TYPES.EMAIL_DISCOVERY]: ACKNOWLEDGEMENT_TEMPLATES.DISCOVERY,
  [EVENT_TYPES.EMAIL_SALES]: ACKNOWLEDGEMENT_TEMPLATES.SALES,
  [EVENT_TYPES.EMAIL_RENEWAL]: ACKNOWLEDGEMENT_TEMPLATES.RENEWAL,
  [EVENT_TYPES.EMAIL_ASSESSMENT]: ACKNOWLEDGEMENT_TEMPLATES.ASSESSMENT,
};

interface ResolvedMessage {
  to: string;
  data: TemplateData;
}

/**
 * Sends one transactional email for an outbox event. Each attempt writes a delivery log row:
 * delivery_started, then provider_accepted or failed. "delivered" is never recorded because no
 * delivery receipt is available from SMTP.
 */
export async function processEmailEvent(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  const template = TEMPLATE_FOR_EVENT[event.type];
  if (!template) throw new PermanentJobError('unknown_email_event', `No template for ${event.type}`);

  const resolved = await resolveMessage(event, deps, template);
  if ('skipReason' in resolved) return { status: 'skipped', reason: resolved.skipReason };

  const rendered = renderTemplate(template, resolved.data);
  const [log] = await deps.db
    .insert(emailDeliveryLogs)
    .values({
      outboxEventId: event.id,
      template,
      provider: deps.email.name,
      recipientFingerprint: fingerprint(resolved.to),
      relatedLeadId: resolved.data.leadId ?? null,
      status: 'delivery_started',
      attempt: event.attempts,
    })
    .returning({ id: emailDeliveryLogs.id });

  try {
    const result = await deps.email.send({ to: resolved.to, subject: rendered.subject, text: rendered.text, category: 'transactional' });
    if (!result.accepted) {
      throw new ExternalServiceError('email', 'Email provider did not accept the message.', { code: ErrorCodes.EXTERNAL_SERVICE_ERROR, retryable: true });
    }
    await deps.db
      .update(emailDeliveryLogs)
      .set({ status: 'provider_accepted', providerMessageId: result.messageId })
      .where(eq(emailDeliveryLogs.id, log!.id));
    return { status: 'sent', reference: result.messageId };
  } catch (error) {
    await deps.db
      .update(emailDeliveryLogs)
      .set({ status: 'failed', errorCode: (error as { code?: string }).code ?? 'email_send_failed' })
      .where(eq(emailDeliveryLogs.id, log!.id));
    throw error;
  }
}

async function resolveMessage(
  event: OutboxRecord,
  deps: Container,
  template: TemplateName,
): Promise<ResolvedMessage | { skipReason: string }> {
  const { db, config } = deps;

  if (template === ACKNOWLEDGEMENT_TEMPLATES.RENEWAL) {
    const contract = await findContractById(db, String(event.payload.contractId));
    if (!contract) return { skipReason: 'contract_not_found' };
    const customer = await findCustomerById(db, contract.customerId);
    if (!customer) return { skipReason: 'customer_not_found' };
    return {
      to: customer.email,
      data: { customerName: customer.name, contractName: contract.name, renewsOn: contract.renewsOn ?? undefined },
    };
  }

  const lead = await findLeadById(db, String(event.payload.leadId));
  if (!lead) return { skipReason: 'lead_not_found' };

  const leadData: TemplateData = {
    leadId: lead.id,
    leadName: lead.name,
    company: lead.company,
    serviceInterest: lead.serviceInterest,
    stage: lead.stage,
    source: lead.source,
    bookingUrl: config.BOOKING_URL ?? null,
  };

  if (template === ACKNOWLEDGEMENT_TEMPLATES.SALES) {
    if (!config.SALES_NOTIFICATION_EMAIL) return { skipReason: 'sales_notification_not_configured' };
    return { to: config.SALES_NOTIFICATION_EMAIL, data: leadData };
  }

  if (template === ACKNOWLEDGEMENT_TEMPLATES.ASSESSMENT) {
    // The outbox payload carries no slug yet, so the title is taken from the seeded catalog.
    const definition = ASSESSMENT_CATALOG[0];
    return {
      to: lead.email,
      data: {
        ...leadData,
        assessmentTitle: definition?.title,
        assessmentScore: Number(event.payload.score),
        assessmentBand: String(event.payload.band),
      },
    };
  }

  return { to: lead.email, data: leadData };
}
