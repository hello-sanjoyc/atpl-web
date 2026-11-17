import { ZodError } from 'zod';
import { pgCodeOf } from '../logger/serializers.js';
import { AppError } from './app.error.js';
import { ErrorCodes } from './error-codes.js';

export interface MappedError {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  expected: boolean;
  retryable: boolean;
  logLevel: 'info' | 'warn' | 'error';
}

const NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ENOTFOUND']);

/** Converts any thrown value into a client-safe response description. Never exposes raw SQL or stacks. */
export function mapError(error: unknown): MappedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      expected: error.operational,
      retryable: error.retryable,
      logLevel: error.statusCode === 429 ? 'warn' : error.operational ? 'info' : 'error',
    };
  }

  if (error instanceof ZodError) {
    return validation(error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message })));
  }

  const fastify = error as { statusCode?: number; code?: string; validation?: unknown[]; message?: string };

  if (Array.isArray(fastify.validation)) {
    const fields = fastify.validation.map((item) => {
      const v = item as { instancePath?: string; params?: { missingProperty?: string }; message?: string; path?: unknown };
      const path = v.instancePath?.replace(/^\//, '').replace(/\//g, '.') || v.params?.missingProperty || 'body';
      return { field: path, message: v.message ?? 'Invalid value' };
    });
    return validation(fields);
  }

  if (fastify.code === 'FST_ERR_CTP_INVALID_JSON_BODY' || fastify.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    return client(400, ErrorCodes.INVALID_JSON, 'The request body must be valid JSON.');
  }
  if (fastify.code === 'FST_ERR_CTP_BODY_TOO_LARGE' || fastify.statusCode === 413) {
    return client(413, ErrorCodes.PAYLOAD_TOO_LARGE, 'The request body is too large.');
  }
  if (fastify.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' || fastify.statusCode === 415) {
    return client(415, ErrorCodes.UNSUPPORTED_MEDIA_TYPE, 'Unsupported content type.');
  }
  if (fastify.code === 'FST_ERR_NOT_FOUND' || fastify.statusCode === 404) {
    return client(404, ErrorCodes.ROUTE_NOT_FOUND, 'The requested route does not exist.');
  }
  if (fastify.statusCode === 429) {
    return { statusCode: 429, code: ErrorCodes.RATE_LIMITED, message: 'Too many requests. Please retry later.', expected: true, retryable: true, logLevel: 'warn' };
  }

  const pgCode = pgCodeOf(error);
  if (pgCode) return mapDatabaseCode(pgCode);

  const networkCode = (error as { code?: string; cause?: { code?: string } }).code ?? (error as { cause?: { code?: string } }).cause?.code;
  if (networkCode && NETWORK_ERROR_CODES.has(networkCode)) {
    return { statusCode: 503, code: ErrorCodes.DATABASE_ERROR, message: 'A dependency is temporarily unavailable.', expected: false, retryable: true, logLevel: 'error' };
  }

  if (typeof fastify.statusCode === 'number' && fastify.statusCode >= 400 && fastify.statusCode < 500) {
    return client(fastify.statusCode, ErrorCodes.BAD_REQUEST, 'The request could not be processed.');
  }

  return { statusCode: 500, code: ErrorCodes.INTERNAL_ERROR, message: 'An unexpected error occurred.', expected: false, retryable: false, logLevel: 'error' };
}

function validation(fields: { field: string; message: string }[]): MappedError {
  return {
    statusCode: 400,
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'Request validation failed.',
    details: { fields },
    expected: true,
    retryable: false,
    logLevel: 'info',
  };
}

function client(statusCode: number, code: string, message: string): MappedError {
  return { statusCode, code, message, expected: true, retryable: false, logLevel: 'info' };
}

function mapDatabaseCode(code: string): MappedError {
  if (code === '23505') {
    return { statusCode: 409, code: ErrorCodes.CONFLICT, message: 'A record with the same unique value already exists.', expected: true, retryable: false, logLevel: 'info' };
  }
  if (code === '23503') {
    return { statusCode: 422, code: ErrorCodes.BUSINESS_RULE_VIOLATION, message: 'A referenced record does not exist or cannot be removed.', expected: true, retryable: false, logLevel: 'info' };
  }
  if (code === '23514' || code === '22P02' || code === '22007' || code === '22003') {
    return { statusCode: 400, code: ErrorCodes.VALIDATION_ERROR, message: 'One or more values are invalid.', expected: true, retryable: false, logLevel: 'info' };
  }
  if (code.startsWith('08') || code === '57014' || code === '57P01' || code === '57P02' || code === '57P03' || code === '40001' || code === '40P01' || code === '53300') {
    return { statusCode: 503, code: ErrorCodes.DATABASE_ERROR, message: 'The database is temporarily unavailable. Please retry.', expected: false, retryable: true, logLevel: 'error' };
  }
  return { statusCode: 500, code: ErrorCodes.DATABASE_ERROR, message: 'A database operation failed.', expected: false, retryable: false, logLevel: 'error' };
}
