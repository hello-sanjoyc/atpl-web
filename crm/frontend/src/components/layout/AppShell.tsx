import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Breadcrumb } from '../Breadcrumb';
import { SalesCopilot } from '../../features/ai/SalesCopilot';
import { useSSEInvalidation } from '../../lib/useSSEInvalidation';

interface Props { children: ReactNode }

export function AppShell({ children }: Props) {
  useSSEInvalidation();
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 py-6 pb-10 max-md:px-5 max-sm:px-4">
        <Breadcrumb />
        {children}
      </main>
      <SalesCopilot />
    </div>
  );
}
