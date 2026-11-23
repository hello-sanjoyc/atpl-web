import type { Container } from '../../container.js';
import { NotFoundError, ValidationError } from '../../errors/app.error.js';
import { ErrorCodes } from '../../errors/error-codes.js';
import type { AuthUser } from '../../types/fastify.js';
import { recordAudit } from '../audit/audit.repository.js';
import { pagination } from '../common/response.js';
import { findCustomerById } from '../customers/customers.repository.js';
import { findOpportunityById } from '../opportunities/opportunities.repository.js';
import { findContractById } from '../customers/customers.repository.js';
import { listExchangeRates, insertExchangeRate, insertRevenueRecord, listRevenueRecords } from './revenue.repository.js';

export interface RevenueInput {
  customerId?: string;
  opportunityId?: string;
  contractId?: string;
  kind: 'invoiced' | 'collected';
  amount: string;
  currency: string;
  recognizedOn: string;
  reference?: string;
}

export interface ExchangeRateInput {
  base: string;
  quote: string;
  rate: string;
  rateDate: string;
  source: string;
}

import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '@aranax/contracts';

export function createRevenueService(deps: Container) {
  const { db, cache, logger } = deps;
  const log = logger.child({ module: 'revenue' });

  return {
    async createRecord(actor: AuthUser, input: RevenueInput) {
      if (input.customerId && !(await findCustomerById(db, input.customerId))) {
        throw new NotFoundError(ErrorCodes.CUSTOMER_NOT_FOUND, 'The linked customer was not found.');
      }
      if (input.opportunityId && !(await findOpportunityById(db, input.opportunityId))) {
        throw new NotFoundError(ErrorCodes.OPPORTUNITY_NOT_FOUND, 'The linked opportunity was not found.');
      }
      if (input.contractId && !(await findContractById(db, input.contractId))) {
        throw new NotFoundError(ErrorCodes.CONTRACT_NOT_FOUND, 'The linked contract was not found.');
      }
      if (!input.customerId && !input.opportunityId && !input.contractId) {
        throw new ValidationError('A revenue record must link to a customer, opportunity or contract.', [
          { field: 'customerId', message: 'Provide at least one link.' },
        ]);
      }

      const row = await db.transaction(async (tx) => {
        const created = await insertRevenueRecord(tx, {
          customerId: input.customerId ?? null,
          opportunityId: input.opportunityId ?? null,
          contractId: input.contractId ?? null,
          kind: input.kind,
          amount: input.amount,
          currency: input.currency,
          recognizedOn: input.recognizedOn,
          reference: input.reference ?? null,
          createdBy: actor.id,
        });
        await recordAudit(tx, {
          actorId: actor.id,
          action: 'revenue.record_created',
          entityType: 'revenue_record',
          entityId: created.id,
          metadata: { kind: input.kind, currency: input.currency, customerId: input.customerId ?? null },
        });
        return created;
      });
      log.info({ event: 'revenue.record_created', recordId: row.id, kind: row.kind, currency: row.currency, actorUserId: actor.id }, 'Revenue record created');
      return row;
    },

    async listRecords(query: { kind?: string; currency?: string; from?: string; to?: string; customerId?: string; page: number; pageSize: number; sort: 'recognizedOn' | 'amount'; order: 'asc' | 'desc' }) {
      const { rows, total } = await listRevenueRecords(db, query, {
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
        sort: query.sort,
        order: query.order,
      });
      return { items: rows, page: pagination(query.page, query.pageSize, total) };
    },

    async createRate(actor: AuthUser, input: ExchangeRateInput) {
      if (input.base === input.quote) throw new ValidationError('Base and quote currencies must differ.', [{ field: 'quote', message: 'Must differ from base.' }]);
      const row = await db.transaction(async (tx) => {
        const created = await insertExchangeRate(tx, {
          base: input.base,
          quote: input.quote,
          rate: input.rate,
          rateDate: input.rateDate,
          source: input.source,
          createdBy: actor.id,
        });
        await recordAudit(tx, {
          actorId: actor.id,
          action: 'exchange_rate.created',
          entityType: 'exchange_rate',
          entityId: created.id,
          metadata: { pair: `${input.base}/${input.quote}`, rateDate: input.rateDate, source: input.source },
        });
        return created;
      });
      await cache.delPattern(CACHE_KEYS.exchangeRates);
      return row;
    },

    async listRates(query: { page: number; pageSize: number; sort: 'rateDate' | 'base'; order: 'asc' | 'desc' }) {
      const { page, pageSize, sort, order } = query;
      const cacheKey = `${CACHE_KEYS.exchangeRates}:p${page}:s${pageSize}:so${sort}:o${order}`;
      return withCache(cache, cacheKey, CACHE_TTL.reference.seconds, async () => {
        const { rows, total } = await listExchangeRates(db, { limit: pageSize, offset: (page - 1) * pageSize, sort, order });
        return { items: rows, page: pagination(page, pageSize, total) };
      });
    },
  };
}
