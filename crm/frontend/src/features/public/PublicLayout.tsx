import type { ReactNode } from 'react';

/** Lightweight public shell — no CRM navbar, same theme tokens. */
export function PublicLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[560px]">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="flex items-center text-[#f86223]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-[#0f1117]">Aranax</span>
        </div>

        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,.10),0_2px_8px_rgba(0,0,0,.04)]">
          <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-[#0f1117]">{title}</h1>
          {subtitle && <p className="text-sm text-[#6b7280] mt-1 mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </main>
  );
}
