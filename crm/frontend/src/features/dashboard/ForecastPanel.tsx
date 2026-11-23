import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';

interface ForecastBand {
  expected: number;
  best: number;
  worst: number;
  currency: string;
}

interface ForecastData {
  snapshotDate: string;
  band30: ForecastBand;
  band60: ForecastBand;
  band90: ForecastBand;
  openOpportunityCount: number;
  aiNarrative: string | null;
  createdAt: string;
  nextRefreshAt: string;
}

function minutesUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));
}

const FORECAST_QUERY_KEY = ['forecasts', 'revenue'] as const;

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function BandCard({ label, band, highlight }: { label: string; band: ForecastBand; highlight?: boolean }) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-[18px]"
      style={highlight ? { background: '#0f1a3d', color: '#ffffff' } : { background: 'var(--dash-paper-dim)' }}
    >
      <p
        className="dash-mono text-[10px] font-medium tracking-[0.12em] uppercase"
        style={{ color: highlight ? 'rgba(255,255,255,.5)' : 'rgba(74,88,120,.55)' }}
      >
        {label}
      </p>
      <div>
        <p
          className="dash-serif text-[28px] font-medium leading-tight"
          style={{ color: highlight ? '#ffffff' : 'var(--dash-ink)' }}
        >
          {fmt(band.expected, band.currency)}
        </p>
        <p className="text-xs mt-1" style={{ color: highlight ? 'rgba(255,255,255,.5)' : 'rgba(74,88,120,.5)' }}>expected</p>
      </div>
      <div className="flex gap-4 text-xs dash-mono" style={{ color: highlight ? 'rgba(255,255,255,.65)' : 'rgba(74,88,120,.65)' }}>
        <div>
          <span className="font-medium">Best </span>
          {fmt(band.best, band.currency)}
        </div>
        <div>
          <span className="font-medium">Worst </span>
          {fmt(band.worst, band.currency)}
        </div>
      </div>
    </div>
  );
}

/**
 * Fetched with React Query at `staleTime: Infinity` so the forecast loads once per session (from
 * the backend's last persisted snapshot — no AI call) and is never silently refetched by a remount,
 * tab focus, or navigation back to the Dashboard. The AI model only runs when the user explicitly
 * clicks Refresh, which busts the cache via `refetch()` with `refresh=true`.
 */
export function ForecastPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<ForecastData>({
    queryKey: FORECAST_QUERY_KEY,
    queryFn: () => http.get<ForecastData>(endpoints.forecasts.revenue, { params: { refresh: false } }),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const refreshMutation = useMutation({
    mutationFn: () => http.get<ForecastData>(endpoints.forecasts.revenue, { params: { refresh: true } }),
    onSuccess: (fresh) => qc.setQueryData(FORECAST_QUERY_KEY, fresh),
  });

  if (isLoading) {
    return (
      <div className="bg-[var(--dash-paper)] border border-[var(--dash-line)] rounded-[22px] p-6">
        <span className="dash-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--dash-ink-soft)]/60">AI Revenue Forecast</span>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#0f1a3d', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[var(--dash-paper)] border border-[var(--dash-line)] rounded-[22px] p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="dash-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--dash-ink-soft)]/60">AI Revenue Forecast</span>
        </div>
        <p className="dash-serif text-[18px] font-medium text-[var(--dash-ink)] mb-1 mt-1">30 / 60 / 90-day pipeline outlook</p>
        <p className="text-[13px] text-[var(--dash-ink-soft)]/60 mb-5">
          {error instanceof Error ? error.message : 'Powered by AI, modeled from your current open pipeline.'}
        </p>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-full text-[13px] font-semibold disabled:opacity-50 transition-all"
          style={{ background: '#0f1a3d', color: '#ffffff' }}
        >
          Load forecast
        </button>
      </div>
    );
  }

  const cooldownMinutes = minutesUntil(data.nextRefreshAt);
  const onCooldown = cooldownMinutes > 0;

  return (
    <div className="bg-[var(--dash-paper)] border border-[var(--dash-line)] rounded-[22px] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="dash-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--dash-ink-soft)]/60">AI Revenue Forecast</span>
          <p className="text-[12px] text-[var(--dash-ink-soft)]/50 mt-1.5">{data.openOpportunityCount} open opportunities · snapshot {formatDate(data.snapshotDate)}</p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending || onCooldown}
          title={onCooldown ? `Refresh regenerates at most once per hour — available in ${cooldownMinutes}m` : undefined}
          className="dash-underline-grow text-[12px] font-medium text-[var(--dash-ink-soft)]/70 hover:text-[var(--dash-ink)] disabled:opacity-50 transition-colors"
        >
          {refreshMutation.isPending ? 'Refreshing…' : onCooldown ? `Available in ${cooldownMinutes}m` : 'Refresh'}
        </button>
      </div>

      {refreshMutation.isError && (
        <p className="text-sm mb-4" style={{ color: '#c4432f' }}>
          {refreshMutation.error instanceof Error ? refreshMutation.error.message : 'Failed to refresh forecast'}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <BandCard label="30-day" band={data.band30} />
        <BandCard label="60-day" band={data.band60} highlight />
        <BandCard label="90-day" band={data.band90} />
      </div>
      {data.aiNarrative && (
        <div className="p-4 rounded-2xl" style={{ background: 'var(--dash-paper-dim)' }}>
          <p className="dash-mono text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--dash-ink-soft)]/55 mb-1.5">AI Narrative</p>
          <p className="text-[13.5px] text-[var(--dash-ink)] leading-relaxed">{data.aiNarrative}</p>
        </div>
      )}
    </div>
  );
}
