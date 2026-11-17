import type { ApiResponseError } from '../api/client';

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
  const requestId = (error as ApiResponseError)?.requestId;
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#fce4ec] flex items-center justify-center text-[#c62828]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#c62828]">{msg}</p>
      {requestId && <small className="text-xs text-[#9ca3af]">Request ID: {requestId}</small>}
    </div>
  );
}
