import type { FastifyReply, FastifyRequest } from 'fastify';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function pagination(page: number, pageSize: number, total: number): Pagination {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Standard success envelope: { success, data, meta: { requestId, ... } }. */
export function sendOk<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta: Record<string, unknown> = {},
) {
  return reply.status(statusCode).send({ success: true, data, meta: { requestId: request.id, ...meta } });
}

export function sendList<T>(request: FastifyRequest, reply: FastifyReply, items: T[], page: Pagination) {
  return reply.status(200).send({ success: true, data: items, meta: { requestId: request.id, pagination: page } });
}
