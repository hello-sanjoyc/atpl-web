import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';

vi.mock('../../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../api/client')>();
  return {
    ...original,
    apiClient: {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      defaults: { baseURL: '/api/v1', headers: {} },
    },
  };
});

vi.mock('../../../api/interceptors', () => ({
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { apiClient } from '../../../api/client';
import Login from '../Login';

describe('Login form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors for empty submit', async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('calls login endpoint on valid submit', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { token: 'tok', user: { id: '1', name: 'Test', email: 't@test.com', role: 'super_admin' } },
        meta: { requestId: 'r1' },
      },
    });
    (apiClient.post as ReturnType<typeof vi.fn>).mockImplementation(mockPost);

    renderWithProviders(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@example.com', password: 'password123' },
      );
    });
  });
});
