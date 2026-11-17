import type { ReactNode } from 'react';

export interface FormInfo {
  /** Heading of the info panel. */
  title: string;
  /** One or two sentences describing what the module is for. */
  description: string;
  /** Short, scannable tips or field guidance. */
  tips?: string[];
}

/**
 * Two-column form layout: the form on the left, a brief info panel on the
 * right that explains the module. The panel drops below the form on narrow
 * screens, so the previously-blank right side is used on wide screens only.
 */
export function FormLayout({ info, children }: { info: FormInfo; children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
      <div className="w-full lg:max-w-2xl lg:flex-1">{children}</div>
      <FormAside info={info} />
    </div>
  );
}

function FormAside({ info }: { info: FormInfo }) {
  return (
    <aside className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-6">
      <div className="rounded-[28px] border border-[#e2e6f0] bg-gradient-to-b from-white to-[#f7f9fd] p-6 shadow-[0_4px_16px_rgba(0,0,0,.05)]">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f86223]/12 text-[#f86223]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <h2 className="text-[15px] font-bold text-[#0f1117]">{info.title}</h2>
        </div>

        <p className="text-[13px] leading-relaxed text-[#6b7280]">{info.description}</p>

        {info.tips && info.tips.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2.5 border-t border-[#e2e6f0] pt-4">
            {info.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-[#374151]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f86223" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
