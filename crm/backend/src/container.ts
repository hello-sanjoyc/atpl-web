import type pg from 'pg';
import type { AppConfig } from './config/env.js';
import { createDatabase, type Database } from './db/client.js';
import { SecurityEventLogger } from './logger/audit-logger.js';
import { createRootLogger, type AppLogger } from './logger/index.js';
import { createCrmAdapter, type CrmAdapter } from './modules/integrations/crm.adapter.js';
import { SmtpEmailProvider } from './modules/email/smtp.provider.js';
import { type EmailProvider, UnconfiguredEmailProvider } from './modules/email/email.provider.js';
import { createOptionsService, type OptionsService } from './modules/options/options.service.js';

export interface Container {
  config: AppConfig;
  logger: AppLogger;
  security: SecurityEventLogger;
  db: Database;
  pool: pg.Pool;
  email: EmailProvider;
  crm: CrmAdapter | null;
  /** App-managed dropdown options (DB-backed, cached) + value validation. */
  options: OptionsService;
  now: () => Date;
  close: () => Promise<void>;
}

export interface ContainerOverrides {
  logger?: AppLogger;
  email?: EmailProvider;
  crm?: CrmAdapter | null;
  now?: () => Date;
}

/** Single composition root. Tests pass overrides for logger, email, CRM and clock. */
export function createContainer(config: AppConfig, overrides: ContainerOverrides = {}): Container {
  const logger = overrides.logger ?? createRootLogger(config);
  const { db, pool } = createDatabase(config, logger.child({ module: 'db' }));
  const email: EmailProvider =
    overrides.email ?? (config.SMTP_HOST ? new SmtpEmailProvider(config) : new UnconfiguredEmailProvider());
  const crm = overrides.crm !== undefined ? overrides.crm : createCrmAdapter(config);
  const security = new SecurityEventLogger(logger.child({ module: 'security' }));
  const options = createOptionsService({ db });

  return {
    config,
    logger,
    security,
    db,
    pool,
    email,
    crm,
    options,
    now: overrides.now ?? (() => new Date()),
    close: async () => {
      await pool.end();
      if (email instanceof SmtpEmailProvider) await email.close();
    },
  };
}
