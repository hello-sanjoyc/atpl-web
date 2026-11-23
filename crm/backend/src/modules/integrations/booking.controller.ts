import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { LEAD_STAGES } from '../../config/constants.js';
import { NotFoundError, AuthenticationError, ValidationError } from '../../errors/app.error.js';
import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '@aranax/contracts';
import { ErrorCodes } from '../../errors/error-codes.js';
import { sha256Hex } from '../../utils/hash.js';
import { withIdempotency } from '../common/idempotency.js';
import { sendOk } from '../common/response.js';
import { captureLeadCore } from '../leads/lead-capture.service.js';
import { findLiveLeadByEmail, insertActivity, insertStageHistory, updateLeadRow } from '../leads/leads.repository.js';
import { recordAudit } from '../audit/audit.repository.js';
import { emailField } from '../common/schemas.js';
import { verifyBookingSignature } from './booking.webhook.js';

const bookingEvent = z.object({
  eventId: z.string().trim().min(1).max(128),
  type: z.enum(['booking.created', 'booking.cancelled']),
  data: z.object({
    email: emailField,
    name: z.string().trim().min(1).max(120).optional(),
    startsAt: z.iso.datetime().optional(),
  }),
});

const STAGE_ORDER = LEAD_STAGES.map((s) => s.key) as readonly string[];
const DISCOVERY_STAGE = 'discovery_scheduled';

/**
 * Booking provider webhooks. The raw body is captured in an encapsulated parser so that the HMAC
 * is computed over the exact bytes received. The parent application's JSON parsing is unaffected.
 */
const bookingController: FastifyPluginAsync = async (app) => {
  const { config, db, security, logger, now } = app.deps;
  const log = logger.child({ module: 'integrations.booking' });

  await app.register(async (scope) => {
    scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
      request.rawBody = body as Buffer;
      try {
        const buffer = body as Buffer;
        done(null, buffer.length > 0 ? JSON.parse(buffer.toString('utf8')) : undefined);
      } catch {
        const error = new Error('Invalid JSON') as Error & { statusCode: number; code: string };
        error.statusCode = 400;
        error.code = 'FST_ERR_CTP_INVALID_JSON_BODY';
        done(error, undefined);
      }
    });

    const typed = scope.withTypeProvider<ZodTypeProvider>();

    typed.get(
      '/public/booking-config',
      {
        schema: {
          tags: ['Public'],
          summary: 'Return the configured booking provider for discovery calls',
        },
      },
      async (request, reply) => {
        const result = await withCache(
          app.deps.cache,
          CACHE_KEYS.bookingConfig,
          CACHE_TTL.reference.seconds,
          async () => {
            const enabled = config.BOOKING_PROVIDER !== 'none' && Boolean(config.BOOKING_URL);
            return { provider: config.BOOKING_PROVIDER, enabled, bookingUrl: enabled ? config.BOOKING_URL : null };
          },
        );
        return sendOk(request, reply, result);
      },
    );

    typed.post(
      '/webhooks/bookings/:provider',
      {
        schema: {
          tags: ['Webhooks'],
          summary: 'Receive booking events from the configured provider',
          description: 'Requires X-Booking-Timestamp and X-Booking-Signature (sha256=HMAC of "timestamp.body").',
          params: z.object({ provider: z.string().regex(/^[a-z0-9_-]+$/) }),
        },
        config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
      },
      async (request, reply) => {
        const { provider } = request.params;
        if (config.BOOKING_PROVIDER === 'none' || provider !== config.BOOKING_PROVIDER) {
          throw new NotFoundError(ErrorCodes.NOT_FOUND, 'Unknown booking provider.');
        }
        const verdict = verifyBookingSignature({
          secret: config.BOOKING_WEBHOOK_SECRET ?? '',
          timestampHeader: request.headers['x-booking-timestamp'] as string | undefined,
          signatureHeader: request.headers['x-booking-signature'] as string | undefined,
          rawBody: request.rawBody ?? Buffer.alloc(0),
          toleranceSeconds: config.BOOKING_WEBHOOK_TOLERANCE_SECONDS,
          nowMs: now().getTime(),
        });
        if (!verdict.ok) {
          if (verdict.reason === 'timestamp') {
            security.record('webhook.replay_rejected', { provider, route: request.routeOptions.url }, 'warn');
            throw new AuthenticationError(ErrorCodes.WEBHOOK_TIMESTAMP_EXPIRED, 'The webhook timestamp is outside the accepted window.');
          }
          security.record('webhook.invalid_signature', { provider, reason: verdict.reason }, 'error');
          throw new AuthenticationError(ErrorCodes.INVALID_WEBHOOK_SIGNATURE, 'The webhook signature is invalid.');
        }

        // The body is validated only after the signature is verified, so unauthenticated input is never parsed.
        const parsed = bookingEvent.safeParse(JSON.parse(request.rawBody?.toString('utf8') || 'null'));
        if (!parsed.success) {
          throw new ValidationError('The booking event payload is invalid.', [{ field: 'body', message: 'Payload does not match the booking event schema.' }]);
        }
        const event = parsed.data;
        const requestHash = sha256Hex(request.rawBody?.toString('utf8') ?? '');
        const result = await withIdempotency(
          db,
          { scope: `webhook:${provider}`, key: event.eventId, requestHash, now: now() },
          async (tx) => {
            const email = event.data.email.toLowerCase();
            const lead = await findLiveLeadByEmail(tx, email);

            if (event.type === 'booking.created') {
              if (lead) {
                if (STAGE_ORDER.indexOf(lead.stage) < STAGE_ORDER.indexOf(DISCOVERY_STAGE) && lead.stage !== 'won' && lead.stage !== 'lost') {
                  await updateLeadRow(tx, lead.id, { stage: DISCOVERY_STAGE });
                  await insertStageHistory(tx, { leadId: lead.id, fromStage: lead.stage, toStage: DISCOVERY_STAGE, reason: `booking:${provider}` });
                }
                await insertActivity(tx, { leadId: lead.id, type: 'meeting', body: 'Discovery call booked', metadata: { provider, startsAt: event.data.startsAt ?? null } });
              } else {
                const outcome = await captureLeadCore(tx, app.deps, {
                  name: event.data.name ?? email.split('@')[0] ?? 'Booking contact',
                  email,
                  source: 'discovery_request',
                  captureChannel: 'other',
                  leadSource: 'other',
                  formSource: `booking:${provider}`,
                  campaignId: null,
                  referralId: null,
                  discoveryRequested: true,
                  marketingConsent: false,
                  privacyPolicyVersion: 'booking-provider',
                  acknowledgementType: null,
                });
                await updateLeadRow(tx, outcome.leadId, { stage: DISCOVERY_STAGE });
                await insertStageHistory(tx, { leadId: outcome.leadId, fromStage: 'new_lead', toStage: DISCOVERY_STAGE, reason: `booking:${provider}` });
              }
              await recordAudit(tx, { action: 'booking.created', entityType: 'booking', entityId: event.eventId, metadata: { provider } });
            } else if (lead) {
              await insertActivity(tx, { leadId: lead.id, type: 'meeting', body: 'Discovery call cancelled', metadata: { provider } });
            }

            return { statusCode: 200, body: { status: 'processed' as const, eventType: event.type } };
          },
        );

        if (result.replayed) {
          log.info({ event: 'webhook.duplicate_ignored', provider, eventId: event.eventId }, 'Duplicate webhook event ignored');
        } else {
          log.info({ event: 'webhook.processed', provider, eventType: event.type }, 'Booking webhook processed');
        }
        return sendOk(request, reply, { ...(result.body as object), replayed: result.replayed }, 200);
      },
    );
  });
};

export default bookingController;
