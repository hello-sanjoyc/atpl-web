import type { Container } from '../../container.js';
import { listSecurityEvents } from './security-events.repository.js';
import { pagination } from '../common/response.js';
import { LOGIN_LOCK_MINUTES, LOGIN_MAX_FAILURES } from '../../config/constants.js';

export interface ListSecurityEventsInput {
  page: number;
  pageSize: number;
  event?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export function createSecurityEventsService(deps: Container) {
  const { db, config } = deps;

  return {
    async list(query: ListSecurityEventsInput) {
      const { rows, total } = await listSecurityEvents(
        db,
        {
          event: query.event,
          userId: query.userId,
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
        },
        { limit: query.pageSize, offset: (query.page - 1) * query.pageSize },
      );
      return { items: rows, page: pagination(query.page, query.pageSize, total) };
    },

    getConfig() {
      return {
        jwtAccessTtl: config.JWT_ACCESS_TTL,
        rateLimit: { max: config.RATE_LIMIT_MAX, window: config.RATE_LIMIT_WINDOW },
        publicRateLimitMax: config.PUBLIC_RATE_LIMIT_MAX,
        corsOrigins: config.corsOrigins,
        trustProxy: config.TRUST_PROXY,
        logRedaction: config.LOG_REDACTION,
        lockoutPolicy: { maxFailures: LOGIN_MAX_FAILURES, lockMinutes: LOGIN_LOCK_MINUTES },
      };
    },
  };
}
