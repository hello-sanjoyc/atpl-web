import { ErrorCodes } from '../../errors/error-codes.js';
import { ExternalServiceError } from '../../errors/app.error.js';

/**
 * Only transactional messages exist in this interface. Promotional sending requires a separate,
 * consent-checked pipeline and is intentionally not representable here.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  category: 'transactional';
}

export interface SendResult {
  messageId: string;
  /** True when the SMTP server accepted the message. This is NOT confirmed delivery. */
  accepted: boolean;
}

export interface EmailProvider {
  readonly name: string;
  send(message: OutgoingEmail): Promise<SendResult>;
}

/** Used when SMTP is not configured. Fails retryably so queued leads wait for configuration. */
export class UnconfiguredEmailProvider implements EmailProvider {
  readonly name = 'unconfigured';

  async send(): Promise<SendResult> {
    throw new ExternalServiceError('email', 'Email provider is not configured.', {
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
      retryable: true,
    });
  }
}
