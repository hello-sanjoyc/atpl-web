import type { Container } from '../../container.js';
import { listAuditEntityTypes, listAuditLogs } from './audit-logs.repository.js';
import { pagination } from '../common/response.js';

export interface ListAuditLogsInput {
  page: number;
  pageSize: number;
  entityType?: string;
  actorId?: string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
}

export function createAuditLogsService(deps: Container) {
  const { db } = deps;

  return {
    async list(query: ListAuditLogsInput) {
      const { rows, total } = await listAuditLogs(
        db,
        {
          entityType: query.entityType,
          actorId: query.actorId,
          action: query.action,
          search: query.search,
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
        },
        { limit: query.pageSize, offset: (query.page - 1) * query.pageSize },
      );
      return { items: rows, page: pagination(query.page, query.pageSize, total) };
    },

    entityTypes() {
      return listAuditEntityTypes(db);
    },
  };
}
