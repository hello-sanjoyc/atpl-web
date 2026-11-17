export function EmptyState({ message = 'No results found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#e4e9f4] flex items-center justify-center text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.3 7L12 12l8.7-5M12 22V12" />
        </svg>
      </div>
      <p className="text-sm text-[#6b7280]">{message}</p>
    </div>
  );
}
