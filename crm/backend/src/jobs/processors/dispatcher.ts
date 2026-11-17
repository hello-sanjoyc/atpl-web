import { EVENT_TYPES } from '../../config/constants.js';
import type { Container } from '../../container.js';
import type { OutboxRecord } from '../queues/outbox.repository.js';
import { processCrmEvent } from './crm.processor.js';
import { processEmailEvent } from './email.processor.js';

/** Business outcome of one outbox event. "skipped" is a deliberate, recorded no-op, never a fake success. */
export type ProcessOutcome = { status: 'sent'; reference?: string } | { status: 'skipped'; reason: string };

/** A failure that must not be retried (for example an event type this build does not know). */
export class PermanentJobError extends Error {
  readonly retryable = false;

  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

const EMAIL_EVENTS = new Set<string>([
  EVENT_TYPES.EMAIL_ACK,
  EVENT_TYPES.EMAIL_DISCOVERY,
  EVENT_TYPES.EMAIL_SALES,
  EVENT_TYPES.EMAIL_RENEWAL,
  EVENT_TYPES.EMAIL_ASSESSMENT,
]);

export async function dispatchOutboxEvent(event: OutboxRecord, deps: Container): Promise<ProcessOutcome> {
  if (event.type === EVENT_TYPES.CRM_SYNC) return processCrmEvent(event, deps);
  if (EMAIL_EVENTS.has(event.type)) return processEmailEvent(event, deps);
  throw new PermanentJobError('unknown_event_type', `Unsupported outbox event type: ${event.type}`);
}
