import { useState } from 'react';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { AppShell } from '../../components/layout/AppShell';
import { formatDate } from '../../lib/format';

interface ChannelInsight {
  channel: string;
  leadsCreated: number;
  qualifiedLeads: number;
  opportunities: number;
  wonOpportunities: number;
  revenueAttributed: string;
  qualificationRate: string;
  conversionRate: string;
  winRate: string;
  aiInsight: string | null;
}

interface CampaignRow {
  campaignId: string;
  campaignName: string;
  channel: string;
  leadsCreated: number;
  qualifiedLeads: number;
  opportunities: number;
  wonOpportunities: number;
}

interface AttributionReport {
  period: { from: string; to: string };
  channels: ChannelInsight[];
  campaigns: CampaignRow[];
  topChannel: string | null;
  aiSummary: string | null;
}

function pct(rate: string) {
  return `${(Number(rate) * 100).toFixed(1)}%`;
}

function fmtRevenue(raw: string) {
  const n = Number(raw);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function RateBar({ value, max }: { value: number; max: number }) {
  const pctW = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full bg-[#00308a] rounded-full" style={{ width: `${pctW}%` }} />
      </div>
      <span className="text-xs text-[#6b7280] w-8 text-right">{pct(String(value / 100))}</span>
    </div>
  );
}

export default function AttributionPage() {
  const [data, setData] = useState<AttributionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'channels' | 'campaigns'>('channels');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<{ data: AttributionReport }>(endpoints.analytics.attribution);
      setData((res.data as unknown as { data: AttributionReport }).data ?? res.data);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  };

  const maxLeads = Math.max(...(data?.channels.map((c) => c.leadsCreated) ?? [1]));

  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-[22px] font-medium tracking-tight text-[#0f1117]">Marketing Attribution</h1>
            {data && (
              <p className="text-sm text-[#9ca3af] mt-0.5">
                {formatDate(data.period.from)} — {formatDate(data.period.to)}
                {data.topChannel && <> · Top channel: <span className="font-semibold text-[#00308a]">{data.topChannel}</span></>}
              </p>
            )}
          </div>
          {!loaded ? (
            <button
              onClick={load}
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-[#00308a] text-white text-[13px] font-bold hover:bg-[#002266] disabled:opacity-50 transition-all"
            >
              {loading ? 'Loading…' : 'Load attribution'}
            </button>
          ) : (
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-[#6b7280] hover:text-[#0f1117] underline disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading && !data && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#00308a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loaded && !loading && (
          <div className="bg-white rounded-[28px] p-10 shadow-[0_4px_16px_rgba(0,0,0,.08)] text-center">
            <p className="text-[#9ca3af] text-sm">Load attribution data to see channel and campaign performance powered by AI.</p>
          </div>
        )}

        {data && (
          <>
            {/* AI Summary */}
            {data.aiSummary && (
              <div className="mb-6 p-5 rounded-[20px] bg-[#f0f4ff] border border-[#dbe4ff]">
                <p className="font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af] mb-1">AI Summary</p>
                <p className="text-sm text-[#0f1117] leading-relaxed">{data.aiSummary}</p>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Channels tracked', value: String(data.channels.length) },
                { label: 'Total leads', value: String(data.channels.reduce((s, c) => s + c.leadsCreated, 0)) },
                { label: 'Total revenue', value: fmtRevenue(String(data.channels.reduce((s, c) => s + Number(c.revenueAttributed), 0))) },
                { label: 'Campaigns', value: String(data.campaigns.length) },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
                  <p className="font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af]">{stat.label}</p>
                  <p className="font-serif text-[26px] font-medium tracking-tight text-[#0f1117] mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 mb-4 bg-[#f1f5f9] rounded-full p-1 w-fit">
              {(['channels', 'campaigns'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${tab === t ? 'bg-white text-[#0f1117] shadow-sm' : 'text-[#6b7280] hover:text-[#0f1117]'}`}
                >
                  {t === 'channels' ? 'Channels' : 'Campaigns'}
                </button>
              ))}
            </div>

            {/* Channels table */}
            {tab === 'channels' && (
              <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,.08)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f1f5f9]">
                        {['Channel', 'Leads', 'Volume', 'Qualified', 'Opps', 'Won', 'Win rate', 'Revenue', 'AI Insight'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9fafb]">
                      {data.channels.map((ch) => (
                        <tr key={ch.channel} className="hover:bg-[#fafbfc] transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-semibold text-[#0f1117]">{ch.channel}</span>
                          </td>
                          <td className="px-5 py-4 text-[#0f1117] font-semibold">{ch.leadsCreated}</td>
                          <td className="px-5 py-4 min-w-[120px]">
                            <RateBar value={ch.leadsCreated} max={maxLeads} />
                          </td>
                          <td className="px-5 py-4 text-[#6b7280]">{pct(ch.qualificationRate)}</td>
                          <td className="px-5 py-4 text-[#6b7280]">{ch.opportunities}</td>
                          <td className="px-5 py-4 text-[#6b7280]">{ch.wonOpportunities}</td>
                          <td className="px-5 py-4">
                            <span className={`font-semibold ${Number(ch.winRate) >= 0.3 ? 'text-green-600' : Number(ch.winRate) >= 0.1 ? 'text-[#f86223]' : 'text-[#9ca3af]'}`}>
                              {pct(ch.winRate)}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#00308a]">{fmtRevenue(ch.revenueAttributed)}</td>
                          <td className="px-5 py-4 text-xs text-[#6b7280] max-w-[200px]">
                            {ch.aiInsight ?? <span className="text-[#d1d5db]">—</span>}
                          </td>
                        </tr>
                      ))}
                      {data.channels.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-10 text-center text-[#9ca3af] text-sm">
                            No channel attribution data for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Campaigns table */}
            {tab === 'campaigns' && (
              <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,.08)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f1f5f9]">
                        {['Campaign', 'Channel', 'Leads', 'Qualified', 'Qual. rate', 'Opps', 'Won', 'Win rate'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9fafb]">
                      {data.campaigns.map((c) => (
                        <tr key={c.campaignId} className="hover:bg-[#fafbfc] transition-colors">
                          <td className="px-5 py-4 font-semibold text-[#0f1117]">{c.campaignName}</td>
                          <td className="px-5 py-4 text-[#6b7280]">{c.channel}</td>
                          <td className="px-5 py-4 font-semibold text-[#0f1117]">{c.leadsCreated}</td>
                          <td className="px-5 py-4 text-[#6b7280]">{c.qualifiedLeads}</td>
                          <td className="px-5 py-4 text-[#6b7280]">
                            {c.leadsCreated > 0 ? pct(String(c.qualifiedLeads / c.leadsCreated)) : '—'}
                          </td>
                          <td className="px-5 py-4 text-[#6b7280]">{c.opportunities}</td>
                          <td className="px-5 py-4 text-[#6b7280]">{c.wonOpportunities}</td>
                          <td className="px-5 py-4">
                            <span className={`font-semibold ${c.opportunities > 0 && c.wonOpportunities / c.opportunities >= 0.3 ? 'text-green-600' : 'text-[#9ca3af]'}`}>
                              {c.opportunities > 0 ? pct(String(c.wonOpportunities / c.opportunities)) : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.campaigns.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-[#9ca3af] text-sm">
                            No campaign attribution data for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
