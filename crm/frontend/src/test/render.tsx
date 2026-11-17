import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import type { ReactElement } from 'react';
import { AuthProvider } from '../app/AuthContext';
import { ToastProvider } from '../components/Toast';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
    options,
  );
}
