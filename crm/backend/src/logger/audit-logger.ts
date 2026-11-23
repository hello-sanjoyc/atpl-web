import type { Logger } from 'pino';
import type { DbExecutor } from '../db/client.js';
import { securityEvents } from '../db/schema/security.js';

export const SECURITY_EVENTS = [
  'auth.login_success',
  'auth.login_failed',
  'auth.account_locked',
  'auth.invalid_token',
  'auth.access_denied',
  'auth.rate_limited',
  'webhook.invalid_signature',
  'webhook.replay_rejected',
  'lead.spam_suppressed',
  'export.sensitive_data',
  'user.permission_changed',
] as const;
export type SecurityEvent = (typeof SECURITY_EVENTS)[number];

interface Bucket {
  windowStart: number;
  count: number;
  suppressed: number;
}

/**
 * Security events go to the same Pino stream as application logs, tagged `category: "security"`,
 * AND are persisted unconditionally to the `security_events` table for the Settings → Security
 * access-log viewer. Each event name is rate-limited per minute on the Pino side only, so an
 * attacker cannot flood the log sink — persistence never drops events, since brute-force
 * investigation data must not be lossy.
 */
export class SecurityEventLogger {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly log: Logger,
    private readonly db: DbExecutor,
    private readonly perMinuteLimit = 30,
    private readonly now: () => number = Date.now,
  ) {}

  record(event: SecurityEvent, fields: Record<string, unknown> = {}, level: 'warn' | 'error' = 'warn'): void {
    const key = event;
    const nowMs = this.now();
    const bucket = this.buckets.get(key);
    if (!bucket || nowMs - bucket.windowStart >= 60_000) {
      if (bucket && bucket.suppressed > 0) {
        this.log.warn(
          { category: 'security', event: 'security.events_suppressed', suppressedEvent: key, suppressed: bucket.suppressed },
          'Security events suppressed by rate limit',
        );
      }
      this.buckets.set(key, { windowStart: nowMs, count: 1, suppressed: 0 });
    } else {
      bucket.count += 1;
      if (bucket.count > this.perMinuteLimit) {
        bucket.suppressed += 1;
        this.persist(event, fields, level);
        return;
      }
    }
    this.log[level]({ category: 'security', event, ...fields }, `Security event: ${event}`);
    this.persist(event, fields, level);
  }

  private persist(event: SecurityEvent, fields: Record<string, unknown>, level: 'warn' | 'error'): void {
    const { userId, ip, userAgent, ...metadata } = fields as Record<string, unknown> & {
      userId?: string;
      ip?: string;
      userAgent?: string;
    };
    void this.db
      .insert(securityEvents)
      .values({
        event,
        level,
        userId: typeof userId === 'string' ? userId : null,
        ip: typeof ip === 'string' ? ip : null,
        userAgent: typeof userAgent === 'string' ? userAgent : null,
        metadata,
      })
      .catch((err: unknown) => {
        this.log.error({ category: 'security', event: 'security.persist_failed', originalEvent: event, err }, 'Failed to persist security event');
      });
  }
}
