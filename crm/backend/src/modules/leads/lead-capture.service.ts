import { EVENT_TYPES, PUBLIC_SPAM_URL_LIMIT } from '../../config/constants.js';
import type { Container } from '../../container.js';
import type { Transaction } from '../../db/client.js';
import { ConflictError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { enqueueOutboxEvent } from '../../jobs/queues/outbox.repository.js';
import { sha256Hex, stableStringify } from '../../utils/hash.js';
import { recordAudit } from '../audit/audit.repository.js';
import { withIdempotency } from '../common/idempotency.js';
import { findCampaignBySlug, findReferralByCode } from '../campaigns/campaigns.repository.js';
import { countUrls, scoreLead } from './lead-scoring.js';
import {
  findLiveLeadByEmail,
  insertActivity,
  insertLeadIfNew,
  insertStageHistory,
  updateLeadRow,
} from './leads.repository.js';

export interface UtmFields {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface CaptureRecord extends UtmFields {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  serviceInterest?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  message?: string | null;
  source: 'website' | 'discovery_request' | 'assessment';
  formSource: string;
  campaignId: string | null;
  referralId: string | null;
  discoveryRequested: boolean;
  marketingConsent: boolean;
  privacyPolicyVersion: string;
  /** Acknowledgement email type queued after a NEW lead is created. Duplicates never re-send. */
  acknowledgementType: string | null;
}

export interface CaptureOutcome {
  created: boolean;
  leadId: string;
}

/** Shared persistence core. Must run inside the caller's transaction. */
export async function captureLeadCore(tx: Transaction, deps: Container, record: CaptureRecord): Promise<CaptureOutcome> {
  const { config, logger } = deps;
  const log = logger.child({ module: 'leads' });
  await deps.options.validateFields(record, {
    serviceInterest: 'service_interest',
    budgetRange: 'budget_range',
    timeline: 'timeline',
  });
  const now = deps.now();
  const email = record.email.toLowerCase();
  const score = scoreLead({
    budgetRange: record.budgetRange,
    timeline: record.timeline,
    hasCompany: Boolean(record.company),
    serviceInterest: record.serviceInterest,
    discoveryRequested: record.discoveryRequested,
  });

  const inserted = await insertLeadIfNew(tx, {
    email,
    name: record.name,
    phone: record.phone ?? null,
    company: record.company ?? null,
    country: record.country ?? null,
    serviceInterest: record.serviceInterest ?? null,
    budgetRange: record.budgetRange ?? null,
    timeline: record.timeline ?? null,
    message: record.message ?? null,
    source: record.source,
    formSource: record.formSource,
    utmSource: record.utmSource ?? null,
    utmMedium: record.utmMedium ?? null,
    utmCampaign: record.utmCampaign ?? null,
    utmTerm: record.utmTerm ?? null,
    utmContent: record.utmContent ?? null,
    campaignId: record.campaignId,
    referralId: record.referralId,
    stage: 'new_lead',
    priority: score.priority,
    score: score.score,
    qualificationStatus: 'unqualified',
    discoveryRequested: record.discoveryRequested,
    marketingConsent: record.marketingConsent,
    marketingConsentAt: record.marketingConsent ? now : null,
    privacyPolicyVersion: record.privacyPolicyVersion,
    consentRecordedAt: now,
  });

  if (inserted) {
    const leadId = inserted.id;
    await insertStageHistory(tx, { leadId, fromStage: null, toStage: 'new_lead', reason: `captured:${record.formSource}` });
    await insertActivity(tx, {
      leadId,
      type: 'system',
      body: `Lead captured via ${record.formSource}`,
      metadata: { source: record.source, score: score.score, scoreBreakdown: score.breakdown },
    });

    const maxAttempts = config.OUTBOX_MAX_ATTEMPTS;
    if (record.acknowledgementType) {
      await enqueueOutboxEvent(tx, {
        type: record.acknowledgementType,
        aggregateType: 'lead',
        aggregateId: leadId,
        payload: { leadId },
        maxAttempts,
      });
    }
    if (config.SALES_NOTIFICATION_EMAIL) {
      await enqueueOutboxEvent(tx, {
        type: EVENT_TYPES.EMAIL_SALES,
        aggregateType: 'lead',
        aggregateId: leadId,
        payload: { leadId },
        maxAttempts,
      });
    }
    await enqueueOutboxEvent(tx, {
      type: EVENT_TYPES.CRM_SYNC,
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: { leadId },
      maxAttempts,
    });

    await recordAudit(tx, {
      action: 'lead.created',
      entityType: 'lead',
      entityId: leadId,
      metadata: { source: record.source, formSource: record.formSource },
    });
    log.info(
      { event: 'lead.created', leadId, source: record.source, formSource: record.formSource, score: score.score, priority: score.priority },
      'Lead created successfully',
    );
    return { created: true, leadId };
  }

  // Duplicate: the address already belongs to a live lead. Record the submission against it.
  const existing = await findLiveLeadByEmail(tx, email);
  if (!existing) {
    // Only possible if the existing lead was removed concurrently; the client may safely retry.
    throw new ConflictError(ErrorCodes.CONFLICT, 'The submission conflicted with a concurrent change. Please retry.');
  }
  await insertActivity(tx, {
    leadId: existing.id,
    type: 'duplicate_submission',
    body: record.message ?? null,
    metadata: {
      formSource: record.formSource,
      discoveryRequested: record.discoveryRequested,
      utmSource: record.utmSource ?? null,
      utmCampaign: record.utmCampaign ?? null,
    },
  });

  if (record.marketingConsent && !existing.marketingConsent && !existing.unsubscribedAt) {
    await updateLeadRow(tx, existing.id, { marketingConsent: true, marketingConsentAt: now });
    await insertActivity(tx, { leadId: existing.id, type: 'note', body: `Marketing consent recorded via ${record.formSource}` });
    await recordAudit(tx, { action: 'lead.consent_recorded', entityType: 'lead', entityId: existing.id, metadata: { channel: 'marketing' } });
  }

  log.info({ event: 'lead.duplicate_detected', leadId: existing.id, formSource: record.formSource }, 'Duplicate submission recorded against existing lead');
  return { created: false, leadId: existing.id };
}

export interface PublicCaptureInput extends UtmFields {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  serviceInterest?: string;
  budgetRange?: string;
  timeline?: string;
  message?: string;
  formSource: string;
  referralCode?: string;
  consent: { privacyPolicy: true; privacyPolicyVersion: string; marketing: boolean };
  website?: string;
  preferredWindow?: string;
}

export interface PublicCaptureResponse {
  statusCode: number;
  body: { status: 'received'; reference: string | null };
  replayed: boolean;
}

const normalizePhone = (value?: string): string | null => (value ? value.replace(/[ ()-]/g, '') : null);

function withoutHoneypot(input: PublicCaptureInput): Omit<PublicCaptureInput, 'website'> {
  const copy: Partial<PublicCaptureInput> = { ...input };
  delete copy.website;
  return copy as Omit<PublicCaptureInput, 'website'>;
}

/** Anonymous lead capture for website forms: honeypot, URL heuristic, idempotency, attribution. */
export function createLeadCaptureService(deps: Container) {
  const { db, security, logger } = deps;
  const log = logger.child({ module: 'leads' });

  async function capture(
    kind: 'lead' | 'discovery',
    input: PublicCaptureInput,
    idempotencyKey: string | undefined,
  ): Promise<PublicCaptureResponse> {
    const suppressed = (reason: string): PublicCaptureResponse => {
      security.record('lead.spam_suppressed', { reason, kind, formSource: input.formSource });
      return { statusCode: 202, body: { status: 'received', reference: null }, replayed: false };
    };
    if (input.website && input.website.trim() !== '') return suppressed('honeypot');
    if (countUrls(input.message) > PUBLIC_SPAM_URL_LIMIT) return suppressed('url_heuristic');

    const email = input.email.toLowerCase();
    const campaign = input.utmCampaign ? await findCampaignBySlug(db, input.utmCampaign.toLowerCase()) : undefined;
    const referral = input.referralCode ? await findReferralByCode(db, input.referralCode) : undefined;

    const requestHash = sha256Hex(stableStringify({ kind, ...withoutHoneypot(input), email }));

    const record: CaptureRecord = {
      name: input.name.trim(),
      email,
      phone: normalizePhone(input.phone),
      company: input.company?.trim() ?? null,
      country: input.country ?? null,
      serviceInterest: input.serviceInterest ?? null,
      budgetRange: input.budgetRange ?? null,
      timeline: input.timeline ?? null,
      message: input.message?.trim() ?? null,
      source: kind === 'lead' ? 'website' : 'discovery_request',
      formSource: input.formSource,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm,
      utmContent: input.utmContent,
      campaignId: campaign?.id ?? null,
      referralId: referral?.id ?? null,
      discoveryRequested: kind === 'discovery',
      marketingConsent: input.consent.marketing,
      privacyPolicyVersion: input.consent.privacyPolicyVersion,
      acknowledgementType: kind === 'discovery' ? EVENT_TYPES.EMAIL_DISCOVERY : EVENT_TYPES.EMAIL_ACK,
    };

    const result = await withIdempotency(
      db,
      { scope: `public:${kind}`, key: idempotencyKey, requestHash, now: deps.now() },
      async (tx) => {
        const outcome = await captureLeadCore(tx, deps, record);
        return {
          statusCode: outcome.created ? 201 : 202,
          body: { status: 'received' as const, reference: outcome.created ? outcome.leadId : null },
        };
      },
    );

    log.debug({ event: 'lead.capture_completed', kind, replayed: result.replayed }, 'Public capture completed');
    return {
      statusCode: result.statusCode,
      body: result.body as PublicCaptureResponse['body'],
      replayed: result.replayed,
    };
  }

  return {
    submitLead: (input: PublicCaptureInput, key?: string) => capture('lead', input, key),
    submitDiscovery: (input: PublicCaptureInput, key?: string) => capture('discovery', input, key),
  };
}
