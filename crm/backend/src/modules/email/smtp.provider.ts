import nodemailer, { type Transporter } from 'nodemailer';
import type { AppConfig } from '../../config/env.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import { ExternalServiceError } from '../../errors/app.error.js';
import type { EmailProvider, OutgoingEmail, SendResult } from './email.provider.js';

interface SmtpError {
  responseCode?: number;
  code?: string;
  message?: string;
}

export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';
  private readonly transport: Transporter;

  constructor(private readonly config: AppConfig) {
    if (!config.SMTP_HOST || !config.SMTP_FROM) {
      throw new Error('SMTP provider requires SMTP_HOST and SMTP_FROM');
    }
    this.transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD ?? '' } : undefined,
      requireTLS: !config.SMTP_SECURE,
      connectionTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(message: OutgoingEmail): Promise<SendResult> {
    try {
      const info = await this.transport.sendMail({
        from: this.config.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        headers: { 'X-Email-Category': message.category },
      });
      const accepted = Array.isArray(info.accepted) && info.accepted.length > 0;
      if (!accepted) {
        throw new ExternalServiceError('smtp', 'SMTP server did not accept the recipient.', {
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          retryable: false,
        });
      }
      return { messageId: info.messageId, accepted };
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      throw classifySmtpError(error);
    }
  }

  async close(): Promise<void> {
    this.transport.close();
  }
}

/** 4xx SMTP replies and network faults are transient; 5xx and auth failures are permanent. */
export function classifySmtpError(error: unknown): ExternalServiceError {
  const e = error as SmtpError;
  const code = e.responseCode;
  const permanent = (code !== undefined && code >= 500) || e.code === 'EAUTH' || e.code === 'EENVELOPE';
  return new ExternalServiceError('smtp', 'Email delivery failed at the SMTP provider.', {
    code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
    retryable: !permanent,
    diagnostics: { smtpCode: code, errorCode: e.code },
    cause: undefined,
  });
}
