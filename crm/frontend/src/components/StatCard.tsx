import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  sparkline?: ReactNode;
}

export function StatCard({ icon, label, value, trend, trendUp, sparkline }: Props) {
  return (
    <div className="group bg-white rounded-[28px] p-5 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,.12)]">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#e4e9f4] flex items-center justify-center text-gray-500 shrink-0">
          {icon}
        </div>
        <span className="flex-1 font-mono text-[11px] font-medium tracking-wide uppercase text-gray-500">{label}</span>
        <button className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-opacity" aria-label="More options">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="4" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="font-serif text-[30px] font-medium tracking-tight text-[#0f1117] leading-none">{value}</span>
        {sparkline && <div className="flex-1 max-w-[90px] h-11 flex items-end">{sparkline}</div>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp === false ? 'text-red-500' : 'text-green-600'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            {trendUp === false
              ? <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            }
          </svg>
          {trend}
        </div>
      )}
    </div>
  );
}
