import type { AppConfig } from '../config/env.js';

/** Emails that must never be touched (deleted, updated) by the demo seed/cleanup scripts. */
export const PROTECTED_EMAILS = new Set(['sany.chowdhury@gmail.com']);

/** Reserved, non-routable email domain (RFC 2606 .test TLD) used to mark every demo record. */
export const DEMO_EMAIL_DOMAIN = 'demo.aranax.test';

export function isProtectedEmail(email: string): boolean {
  return PROTECTED_EMAILS.has(email.toLowerCase());
}

export function assertNotProtected(email: string): void {
  if (isProtectedEmail(email)) {
    throw new Error(`Refusing to modify protected account: ${email}`);
  }
}

/**
 * Fails closed unless DATABASE_URL clearly points at a local/dev database. Set
 * ALLOW_REMOTE_DEMO_SEED=true to override for a shared remote dev DB.
 */
export function assertSafeDatabaseHost(config: AppConfig): void {
  if (process.env.ALLOW_REMOTE_DEMO_SEED === 'true') return;

  let host: string;
  try {
    host = new URL(config.DATABASE_URL).hostname.toLowerCase();
  } catch {
    throw new Error('DATABASE_URL could not be parsed; refusing to seed demo data.');
  }

  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal');

  if (!isLocal) {
    throw new Error(
      `DATABASE_URL host "${host}" does not look like a local/dev database. ` +
        'Refusing to seed or clean up demo data. Set ALLOW_REMOTE_DEMO_SEED=true to override.',
    );
  }
}
