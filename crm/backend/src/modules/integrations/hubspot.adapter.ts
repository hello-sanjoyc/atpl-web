import { ErrorCodes } from '../../errors/error-codes.js';
import { ExternalServiceError } from '../../errors/app.error.js';
import type { CrmAdapter, CrmLeadPayload, CrmUpsertResult } from './crm.adapter.js';

const BASE_URL = 'https://api.hubapi.com';
const TIMEOUT_MS = 10_000;

export interface HubSpotOptions {
  accessToken: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

/**
 * HubSpot contact upsert via the CRM v3 API. A 409 "already exists" response is treated as a
 * successful match, and the existing contact ID is taken from the response message.
 * Provider payloads are never logged; only status codes and error categories are recorded.
 */
export class HubSpotCrmAdapter implements CrmAdapter {
  readonly name = 'hubspot';
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(private readonly options: HubSpotOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? BASE_URL;
  }

  async upsertLead(lead: CrmLeadPayload): Promise<CrmUpsertResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.options.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            email: lead.email,
            firstname: lead.name.split(' ')[0],
            lastname: lead.name.split(' ').slice(1).join(' ') || undefined,
            phone: lead.phone ?? undefined,
            company: lead.company ?? undefined,
            country: lead.country ?? undefined,
            hs_lead_status: lead.stage,
            lead_source_internal: lead.source,
            internal_lead_id: lead.leadId,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new ExternalServiceError('hubspot', 'HubSpot is unreachable.', {
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        retryable: true,
        diagnostics: { errorType: (error as Error).name },
      });
    }

    if (response.ok) {
      const body = (await response.json()) as { id: string };
      return { externalId: body.id, created: true };
    }

    if (response.status === 409) {
      const text = await response.text();
      const match = /Existing ID:\s*(\d+)/.exec(text);
      if (match?.[1]) return { externalId: match[1], created: false };
    }

    const transient = response.status === 429 || response.status >= 500;
    throw new ExternalServiceError('hubspot', 'HubSpot rejected the contact sync.', {
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
      retryable: transient,
      diagnostics: { providerStatus: response.status },
    });
  }
}
