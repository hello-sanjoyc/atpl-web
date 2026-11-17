import { EVENT_TYPES } from '../../config/constants.js';
import type { Container } from '../../container.js';
import { NotFoundError, ValidationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { enqueueOutboxEvent } from '../../jobs/queues/outbox.repository.js';
import { sha256Hex, stableStringify } from '../../utils/hash.js';
import { withIdempotency } from '../common/idempotency.js';
import { findCampaignBySlug, findReferralByCode } from '../campaigns/campaigns.repository.js';
import { captureLeadCore, type CaptureRecord } from '../leads/lead-capture.service.js';
import type { AssessmentDefinition } from './assessment.catalog.js';
import { findActiveAssessmentBySlug, insertSubmission, listActiveAssessments, type AssessmentRow } from './assessments.repository.js';

export interface EvaluationResult {
  score: number;
  maxScore: 100;
  band: { key: string; label: string };
  recommendation: string;
  breakdown: Array<{ questionId: string; points: number; maxPoints: number }>;
}

export function evaluateAnswers(assessment: Pick<AssessmentRow, 'questions' | 'bands'>, answers: Record<string, string>): EvaluationResult {
  const issues: Array<{ field: string; message: string }> = [];
  let earned = 0;
  let possible = 0;
  const breakdown: EvaluationResult['breakdown'] = [];

  for (const question of assessment.questions) {
    const maxPoints = Math.max(...question.options.map((o) => o.points));
    possible += maxPoints;
    const chosen = answers[question.id];
    if (chosen === undefined) {
      issues.push({ field: `answers.${question.id}`, message: 'This question must be answered.' });
      continue;
    }
    const option = question.options.find((o) => o.value === chosen);
    if (!option) {
      issues.push({ field: `answers.${question.id}`, message: 'The selected option is not valid.' });
      continue;
    }
    earned += option.points;
    breakdown.push({ questionId: question.id, points: option.points, maxPoints });
  }

  const unknown = Object.keys(answers).filter((k) => !assessment.questions.some((q) => q.id === k));
  for (const key of unknown) issues.push({ field: `answers.${key}`, message: 'Unknown question.' });
  if (issues.length > 0) throw new ValidationError('The assessment answers are incomplete or invalid.', issues);

  const score = Math.round((earned / possible) * 100);
  const band = [...assessment.bands].sort((a, b) => b.min - a.min).find((b) => score >= b.min) ?? assessment.bands[assessment.bands.length - 1];
  if (!band) throw new Error('Assessment has no score bands configured');
  return { score, maxScore: 100, band: { key: band.key, label: band.label }, recommendation: band.recommendation, breakdown };
}

export function toPublicAssessment(row: AssessmentRow | AssessmentDefinition) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    questions: row.questions.map((q) => ({
      id: q.id,
      label: q.label,
      options: q.options.map((o) => ({ value: o.value, label: o.label })),
    })),
  };
}

export interface AssessmentSubmitInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  answers: Record<string, string>;
  consent: { privacyPolicy: true; privacyPolicyVersion: string; marketing: boolean };
  referralCode?: string;
  website?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export function createAssessmentsService(deps: Container) {
  const { db, config, security, logger } = deps;
  const log = logger.child({ module: 'assessments' });

  async function loadActive(slug: string): Promise<AssessmentRow> {
    const row = await findActiveAssessmentBySlug(db, slug);
    if (!row) throw new NotFoundError(ErrorCodes.ASSESSMENT_NOT_FOUND, 'The requested assessment was not found.');
    return row;
  }

  return {
    async list() {
      return (await listActiveAssessments(db)).map(toPublicAssessment);
    },

    async get(slug: string) {
      return toPublicAssessment(await loadActive(slug));
    },

    async evaluate(slug: string, answers: Record<string, string>) {
      const assessment = await loadActive(slug);
      return evaluateAnswers(assessment, answers);
    },

    async submit(slug: string, input: AssessmentSubmitInput, idempotencyKey: string | undefined) {
      if (input.website && input.website.trim() !== '') {
        security.record('lead.spam_suppressed', { reason: 'honeypot', kind: 'assessment', slug });
        return { statusCode: 202, body: { status: 'received', reference: null, score: null, band: null }, replayed: false };
      }

      const assessment = await loadActive(slug);
      const evaluation = evaluateAnswers(assessment, input.answers);
      const email = input.email.toLowerCase();
      const campaign = input.utmCampaign ? await findCampaignBySlug(db, input.utmCampaign.toLowerCase()) : undefined;
      const referral = input.referralCode ? await findReferralByCode(db, input.referralCode) : undefined;
      const { website: _w, referralCode: _r, ...hashable } = input;
      const requestHash = sha256Hex(stableStringify({ slug, ...hashable, email }));

      const result = await withIdempotency(
        db,
        { scope: `public:assessment:${slug}`, key: idempotencyKey, requestHash, now: deps.now() },
        async (tx) => {
          const record: CaptureRecord = {
            name: input.name.trim(),
            email,
            phone: input.phone?.replace(/[ ()-]/g, '') ?? null,
            company: input.company?.trim() ?? null,
            country: input.country ?? null,
            serviceInterest: null,
            budgetRange: null,
            timeline: null,
            message: null,
            source: 'assessment',
            formSource: `assessment:${slug}`,
            utmSource: input.utmSource,
            utmMedium: input.utmMedium,
            utmCampaign: input.utmCampaign,
            utmTerm: input.utmTerm,
            utmContent: input.utmContent,
            campaignId: campaign?.id ?? null,
            referralId: referral?.id ?? null,
            discoveryRequested: false,
            marketingConsent: input.consent.marketing,
            privacyPolicyVersion: input.consent.privacyPolicyVersion,
            acknowledgementType: null,
          };
          const outcome = await captureLeadCore(tx, deps, record);
          await insertSubmission(tx, {
            assessmentId: assessment.id,
            leadId: outcome.leadId,
            score: evaluation.score,
            band: evaluation.band.key,
            answers: input.answers,
          });
          if (outcome.created) {
            // Report emails go only to newly captured addresses, which limits abuse of the form.
            await enqueueOutboxEvent(tx, {
              type: EVENT_TYPES.EMAIL_ASSESSMENT,
              aggregateType: 'lead',
              aggregateId: outcome.leadId,
              payload: { leadId: outcome.leadId, assessmentId: assessment.id, score: evaluation.score, band: evaluation.band.key },
              maxAttempts: config.OUTBOX_MAX_ATTEMPTS,
            });
          }
          return {
            statusCode: outcome.created ? 201 : 202,
            body: {
              status: 'received' as const,
              reference: outcome.created ? outcome.leadId : null,
              score: evaluation.score,
              band: evaluation.band,
            },
          };
        },
      );

      log.info({ event: 'assessment.submitted', slug, replayed: result.replayed, score: evaluation.score }, 'Assessment submission processed');
      return { statusCode: result.statusCode, body: result.body, replayed: result.replayed };
    },
  };
}
