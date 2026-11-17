import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface Props { children: ReactNode }

export function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 py-6 pb-10 max-md:px-5 max-sm:px-4">
        {children}
      </main>
    </div>
  );
}
