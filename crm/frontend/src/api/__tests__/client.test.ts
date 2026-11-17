import { describe, it, expect } from 'vitest';
import { apiClient, unwrap, ApiResponseError, isApiSuccess } from '../client';

describe('apiClient base URL', () => {
  it('resolves to /api/v1 when VITE_API_BASE_URL is empty', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1');
  });
});

describe('unwrap', () => {
  it('returns data on success', () => {
    const result = unwrap({ success: true, data: { id: '1' }, meta: { requestId: 'r1' } });
    expect(result).toEqual({ id: '1' });
  });
  it('throws ApiResponseError on failure', () => {
    expect(() =>
      unwrap({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, meta: { requestId: 'r2' } })
    ).toThrow(ApiResponseError);
  });
  it('thrown error has code and requestId', () => {
    try {
      unwrap({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, meta: { requestId: 'r3' } });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiResponseError);
      expect((e as ApiResponseError).code).toBe('NOT_FOUND');
      expect((e as ApiResponseError).requestId).toBe('r3');
    }
  });
});

describe('isApiSuccess', () => {
  it('returns true for success response', () => {
    expect(isApiSuccess({ success: true, data: null, meta: { requestId: 'x' } })).toBe(true);
  });
  it('returns false for error response', () => {
    expect(isApiSuccess({ success: false, error: { code: 'E', message: 'm' }, meta: { requestId: 'x' } })).toBe(false);
  });
});
