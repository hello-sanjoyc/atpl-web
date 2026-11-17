import { type ErrorCode, ErrorCodes } from './error-codes.js';

export interface FieldIssue {
  field: string;
  message: string;
}

export interface AppErrorOptions {
  /** Public-safe structured details (e.g. field issues). Never include raw input values. */
  details?: Record<string, unknown>;
  /** Internal diagnostics. Logged only, never returned to clients. */
  diagnostics?: Record<string, unknown>;
  retryable?: boolean;
  cause?: unknown;
}

/**
 * Base class for every expected, typed failure. `operational` errors are anticipated business or
 * client failures; non-operational errors indicate a defect or infrastructure fault.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly operational: boolean;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
  readonly diagnostics?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, statusCode: number, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.operational = statusCode < 500;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
    this.diagnostics = options.diagnostics;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed.', fields: FieldIssue[] = [], code: ErrorCode = ErrorCodes.VALIDATION_ERROR) {
    super(code, message, 400, { details: fields.length ? { fields } : undefined });
  }
}

export class AuthenticationError extends AppError {
  constructor(code: ErrorCode = ErrorCodes.UNAUTHENTICATED, message = 'Authentication is required.') {
    super(code, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(ErrorCodes.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode = ErrorCodes.NOT_FOUND, message = 'The requested resource was not found.') {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = ErrorCodes.CONFLICT, message = 'The request conflicts with the current state.', options: AppErrorOptions = {}) {
    super(code, message, 409, options);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please retry later.') {
    super(ErrorCodes.RATE_LIMITED, message, 429, { retryable: true });
  }
}

export class BusinessRuleError extends AppError {
  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(code, message, 422, options);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database operation failed.', options: AppErrorOptions = {}) {
    super(ErrorCodes.DATABASE_ERROR, message, 503, { retryable: options.retryable ?? true, ...options });
  }
}

export class ExternalServiceError extends AppError {
  readonly provider: string;

  constructor(provider: string, message: string, options: AppErrorOptions & { code?: ErrorCode } = {}) {
    super(options.code ?? ErrorCodes.EXTERNAL_SERVICE_ERROR, message, 502, options);
    this.provider = provider;
  }
}
