export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex items-center justify-center py-16">
      <span
        aria-hidden="true"
        className="w-8 h-8 rounded-full border-[3px] border-[#e2e6f0] border-t-[#f86223] animate-spin"
      />
    </div>
  );
}
