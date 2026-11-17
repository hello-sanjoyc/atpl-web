import { describe, expect, it } from 'vitest';
import { mapError } from '../../src/errors/error-mapper.js';
import { ConflictError, NotFoundError } from '../../src/errors/app.error.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';

describe('mapError', () => {
  it('maps a unique violation to 409 without leaking SQL', () => {
    const mapped = mapError(Object.assign(new Error('duplicate key value violates unique constraint "leads_email"'), { code: '23505' }));
    expect(mapped.statusCode).toBe(409);
    expect(JSON.stringify(mapped)).not.toContain('duplicate key');
  });

  it('maps a foreign key violation to 422', () => {
    expect(mapError(Object.assign(new Error('fk'), { code: '23503' })).statusCode).toBe(422);
  });

  it('maps connection-class database failures to retryable 503', () => {
    const mapped = mapError(Object.assign(new Error('terminating connection'), { code: '57P01' }));
    expect(mapped.statusCode).toBe(503);
    expect(mapped.retryable).toBe(true);
  });

  it('maps network errors to 503', () => {
    expect(mapError(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })).statusCode).toBe(503);
  });

  it('keeps application errors and their stable codes', () => {
    const mapped = mapError(new NotFoundError(ErrorCodes.LEAD_NOT_FOUND, 'The requested lead was not found.'));
    expect(mapped.statusCode).toBe(404);
    expect(mapped.code).toBe(ErrorCodes.LEAD_NOT_FOUND);
  });

  it('maps unknown failures to a generic 500', () => {
    const mapped = mapError(new Error('secret internal detail'));
    expect(mapped.statusCode).toBe(500);
    expect(JSON.stringify(mapped)).not.toContain('secret internal detail');
  });

  it('exposes conflict errors as 409', () => {
    expect(mapError(new ConflictError(ErrorCodes.DUPLICATE_LEAD, 'Duplicate.')).statusCode).toBe(409);
  });
});
