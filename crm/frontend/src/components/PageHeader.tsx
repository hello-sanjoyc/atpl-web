import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function PageHeader({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  /** A primary action, usually a "New" link. */
  action?: { label: string; to: string } | ReactNode;
  /** Filter row or extra controls rendered under the title. */
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 pt-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-[#6b7280] mt-1">{subtitle}</p>}
        </div>
        {action &&
          (isActionLink(action) ? (
            <Link
              to={action.to}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold hover:bg-[#d94f15] active:scale-[.99] transition-all shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {action.label}
            </Link>
          ) : (
            action
          ))}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function isActionLink(a: unknown): a is { label: string; to: string } {
  return typeof a === 'object' && a !== null && 'to' in a && 'label' in a;
}
