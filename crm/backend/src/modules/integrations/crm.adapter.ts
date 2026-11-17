import type { AppConfig } from '../../config/env.js';
import { ExternalServiceError } from '../../errors/app.error.js';
import { HubSpotCrmAdapter } from './hubspot.adapter.js';

export interface CrmLeadPayload {
  leadId: string;
  email: string;
  name: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  source: string;
  stage: string;
}

export interface CrmUpsertResult {
  externalId: string;
  created: boolean;
}

export interface CrmAdapter {
  readonly name: string;
  upsertLead(lead: CrmLeadPayload): Promise<CrmUpsertResult>;
}

/** Creates the configured adapter, or null when CRM synchronisation is intentionally disabled. */
export function createCrmAdapter(config: AppConfig): CrmAdapter | null {
  switch (config.CRM_PROVIDER) {
    case 'none':
      return null;
    case 'hubspot':
      return new HubSpotCrmAdapter({ accessToken: config.HUBSPOT_ACCESS_TOKEN ?? '' });
    default:
      throw new ExternalServiceError('crm', `Unsupported CRM provider: ${String(config.CRM_PROVIDER)}`, { retryable: false });
  }
}
