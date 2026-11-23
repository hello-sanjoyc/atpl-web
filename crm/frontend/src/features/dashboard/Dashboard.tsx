import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import './dashboard.css';
import { AppShell } from '../../components/layout/AppShell';
import { DonutChart } from '../../components/DonutChart';
import { BarChart } from '../../components/BarChart';
import { TrendChart } from '../../components/TrendChart';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../app/AuthContext';
import { useResourceList, useResourceDetail } from '../_shared/hooks';
import { endpoints } from '../../api/endpoints';
import { http } from '../../api/client';
import { formatDate, formatMoney } from '../../lib/format';
import { ForecastPanel } from './ForecastPanel';
import type { Lead, Opportunity, FollowUp, Customer, Campaign, Referral } from '../_shared/types';
import { OPPORTUNITY_STAGES } from '@aranax/contracts';

// ─── Analytics overview types ──────────────────────────────────────────────────

interface MoneyResultOk { status: 'ok'; amount: string; currency: string }
interface MoneyResultInsufficient { status: 'insufficient_data'; reason: string; missingCurrencies: string[] }
type MoneyResult = MoneyResultOk | MoneyResultInsufficient;

interface AnalyticsOverview {
  period: { from: string; to: string };
  funnel: {
    leadsCreated: number;
    qualificationBreakdown: { status: string; count: number }[];
    opportunities: { open: number; won: number; lost: number };
    leadToWonRate: string | null;
    winRate: string | null;
    leadsByMonth: { month: string; count: number }[];
  };
  revenue?: {
    baseCurrency: string;
    invoiced: MoneyResult;
    collected: MoneyResult;
  };
}

interface MonthlyCount {
  month: string;
  count: number;
}

interface AnalyticsTrends {
  months: string[];
  leads: MonthlyCount[];
  opportunities: MonthlyCount[];
  customers: MonthlyCount[];
  revenue?: { baseCurrency: string; series: MonthlyCount[] };
}

// ─── Palette (scoped to this page — see dashboard.css) ─────────────────────────

const INK = '#0f1a3d';
const AMBER = '#e8601f';
const AMBER_BRIGHT = '#f86223';
const MOSS = '#2e7d4f';
const RUST = '#c4432f';
const BLUE = '#2563a8';
const VIOLET = '#7c4fc4';
const TEAL = '#1b8a8a';
const LINE = '#dde4f2';

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconArrowUpRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17 17 7" /><path d="M7 7h10v10" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Small shared pieces ────────────────────────────────────────────────────────

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-[var(--dash-paper)] border border-[var(--dash-line)] rounded-[22px] ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="dash-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--dash-ink-soft)]/60">
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--dash-ink-soft)]/50 py-2">{children}</p>;
}

/** "2026-03" -> "Mar" */
function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
}

function StatTile({
  index,
  to,
  label,
  value,
  detail,
  accent,
}: {
  index: number;
  to: string;
  label: string;
  value: string;
  detail?: string;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between gap-6 px-6 py-6 border-r border-[var(--dash-line)] last:border-r-0 max-sm:border-r-0 max-sm:border-b max-sm:last:border-b-0 transition-colors hover:bg-[var(--dash-paper-dim)] overflow-hidden"
    >
      <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <span className="dash-mono text-[10px] tracking-[0.14em] uppercase text-[var(--dash-ink-soft)]/45">
          {String(index).padStart(2, '0')} · {label}
        </span>
        <span style={{ color: accent }}>
          <IconArrowUpRight />
        </span>
      </div>
      <div>
        <div className="dash-serif text-[40px] leading-none font-medium tracking-tight" style={{ color: accent }}>
          {value}
        </div>
        {detail && <div className="mt-2 text-[12.5px] text-[var(--dash-ink-soft)]/65">{detail}</div>}
      </div>
    </Link>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const overview = useResourceDetail<AnalyticsOverview>(['analytics', 'overview'], endpoints.analytics.overview);
  const [trendMonths, setTrendMonths] = useState(12);
  const trends = useQuery<AnalyticsTrends>({
    queryKey: ['analytics', 'trends', trendMonths],
    queryFn: () => http.get<AnalyticsTrends>(endpoints.analytics.trends, { params: { months: trendMonths } }),
  });
  const leads = useResourceList<Lead>(['leads'], endpoints.leads.list, { pageSize: 5, sort: 'createdAt', order: 'desc' });
  const customers = useResourceList<Customer>(['customers'], endpoints.customers.list, { pageSize: 1 });
  const activeCustomers = useResourceList<Customer>(['customers'], endpoints.customers.list, { pageSize: 1, status: 'active' });
  const followUps = useResourceList<FollowUp>(['follow-ups'], endpoints.followUps.list, { pageSize: 6, status: 'open', sort: 'dueAt', order: 'asc' });
  const campaigns = useResourceList<Campaign>(['campaigns'], endpoints.campaigns.list, { pageSize: 1, status: 'active' });
  const campaignsTotal = useResourceList<Campaign>(['campaigns'], endpoints.campaigns.list, { pageSize: 1 });
  const referrals = useResourceList<Referral>(['referrals'], endpoints.referrals.list, { pageSize: 1 });

  const openStages = OPPORTUNITY_STAGES.filter((s) => !s.terminal);
  const stageParams = (stageKey: string) => ({ pageSize: 4, stage: stageKey, sort: 'estimatedValue' as const, order: 'desc' as const });
  const discoveryOpps = useResourceList<Opportunity>(['opportunities', 'dashboard', 'discovery'], endpoints.opportunities.list, stageParams('discovery'));
  const proposalOpps = useResourceList<Opportunity>(['opportunities', 'dashboard', 'proposal_sent'], endpoints.opportunities.list, stageParams('proposal_sent'));
  const negotiationOpps = useResourceList<Opportunity>(['opportunities', 'dashboard', 'negotiation'], endpoints.opportunities.list, stageParams('negotiation'));
  const opportunitiesByStage: Record<string, typeof discoveryOpps> = {
    discovery: discoveryOpps,
    proposal_sent: proposalOpps,
    negotiation: negotiationOpps,
  };
  const pipelineByStage = openStages.map((stage) => ({ stage, query: opportunitiesByStage[stage.key] }));

  const funnel = overview.data?.funnel;
  const revenue = overview.data?.revenue;
  const winRatePct = funnel?.winRate ? Math.round(Number(funnel.winRate) * 100) : 0;

  return (
    <AppShell>
      <div className="dash-root dash-grain -mx-6 -mt-6 -mb-10 px-6 pt-6 pb-10 max-md:-mx-5 max-md:px-5 max-sm:-mx-4 max-sm:px-4">
        {/* ── Masthead ──────────────────────────────────────────────────── */}
        <div className="dash-fade flex items-end justify-between flex-wrap gap-4 pt-6 pb-7 border-b border-[var(--dash-line)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SectionLabel>{today}</SectionLabel>
              {followUps.data && (
                <>
                  <span className="text-[var(--dash-ink-soft)]/30">—</span>
                  <SectionLabel>{followUps.data.pagination.total} open follow-ups</SectionLabel>
                </>
              )}
            </div>
            <h1 className="dash-serif text-[44px] max-sm:text-[32px] leading-[1.02] font-medium text-[var(--dash-ink)] tracking-tight">
              {greeting}, <span className="italic" style={{ color: AMBER }}>{firstName}</span>.
            </h1>
          </div>
          <p className="text-[13.5px] text-[var(--dash-ink-soft)]/60 max-w-[260px] leading-relaxed">
            Here's where the pipeline stands this period — qualification, revenue, and what needs your attention.
          </p>
        </div>

        {/* ── Stat strip ────────────────────────────────────────────────── */}
        <div className="dash-stagger grid grid-cols-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1 border border-t-0 border-[var(--dash-line)] bg-[var(--dash-paper)]">
          <StatTile
            index={1}
            to="/leads"
            label="Total Leads"
            value={funnel ? String(funnel.leadsCreated) : '—'}
            detail={leads.data ? `${leads.data.pagination.total} all-time` : undefined}
            accent={AMBER_BRIGHT}
          />
          <StatTile
            index={2}
            to="/opportunities?status=open"
            label="Open Opportunities"
            value={funnel ? String(funnel.opportunities.open) : '—'}
            detail={funnel ? `${funnel.opportunities.won} won · ${funnel.opportunities.lost} lost` : undefined}
            accent={BLUE}
          />
          <StatTile
            index={3}
            to="/customers?status=active"
            label="Active Customers"
            value={activeCustomers.data ? String(activeCustomers.data.pagination.total) : '—'}
            detail={customers.data ? `${customers.data.pagination.total} total` : undefined}
            accent={TEAL}
          />
          <StatTile
            index={4}
            to="/revenue"
            label="Revenue Invoiced"
            value={
              revenue?.invoiced.status === 'ok'
                ? formatMoney(revenue.invoiced.amount, revenue.invoiced.currency)
                : revenue?.invoiced.status === 'insufficient_data'
                  ? 'N/A'
                  : '—'
            }
            detail={
              revenue?.invoiced.status === 'insufficient_data'
                ? `Missing FX rate: ${revenue.invoiced.missingCurrencies.join(', ')}`
                : revenue?.collected.status === 'ok'
                  ? `${formatMoney(revenue.collected.amount, revenue.collected.currency)} collected`
                  : undefined
            }
            accent={VIOLET}
          />
        </div>

        {/* ── Main row: funnel + right rail ─────────────────────────────── */}
        <div className="grid grid-cols-[1fr_320px] gap-6 mt-8 items-start max-[1100px]:grid-cols-1">
          <Card className="p-7">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <SectionLabel>Funnel &amp; Qualification</SectionLabel>
                <h2 className="dash-serif text-[22px] font-medium text-[var(--dash-ink)] mt-1">How leads convert</h2>
              </div>
              {overview.data && (
                <span className="dash-mono text-[11px] text-[var(--dash-ink-soft)]/50 mt-1">
                  {formatDate(overview.data.period.from)} → {formatDate(overview.data.period.to)}
                </span>
              )}
            </div>

            {overview.isLoading && <Empty>Loading…</Empty>}
            {overview.error && <Empty>Could not load analytics.</Empty>}
            {funnel && (
              <>
                <div className="grid sm:grid-cols-3 gap-px bg-[var(--dash-line)] rounded-2xl overflow-hidden mb-7">
                  {funnel.qualificationBreakdown.map((q) => {
                    const qualColor: Record<string, string> = { qualified: MOSS, unqualified: BLUE, disqualified: RUST };
                    return (
                      <div key={q.status} className="flex flex-col gap-1.5 p-5 bg-[var(--dash-paper)]">
                        <SectionLabel>{q.status}</SectionLabel>
                        <span className="dash-serif text-[30px] font-medium leading-none" style={{ color: qualColor[q.status] ?? INK }}>{q.count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-8 flex-wrap pb-7 mb-7 border-b border-[var(--dash-line)]">
                  <div>
                    <SectionLabel>Lead → Won</SectionLabel>
                    <div className="dash-serif text-[20px] font-medium mt-1" style={{ color: AMBER_BRIGHT }}>
                      {funnel.leadToWonRate ? `${(Number(funnel.leadToWonRate) * 100).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Win Rate</SectionLabel>
                    <div className="dash-serif text-[20px] font-medium mt-1" style={{ color: VIOLET }}>
                      {funnel.winRate ? `${(Number(funnel.winRate) * 100).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 mb-2">
                  <div>
                    <h3 className="text-[12.5px] font-semibold text-[var(--dash-ink)] mb-4">Opportunities by outcome</h3>
                    <BarChart
                      bars={[
                        { label: 'Open', value: funnel.opportunities.open, color: AMBER },
                        { label: 'Won', value: funnel.opportunities.won, color: MOSS },
                        { label: 'Lost', value: funnel.opportunities.lost, color: RUST },
                      ]}
                      trackColor={LINE}
                      labelColor="rgba(74,88,120,.65)"
                      valueColor={INK}
                      labelClassName="text-[13px] dash-mono"
                      valueClassName="text-[18px] dash-serif font-medium"
                    />
                  </div>
                  <div>
                    <h3 className="text-[12.5px] font-semibold text-[var(--dash-ink)] mb-4">Open pipeline by stage</h3>
                    <BarChart
                      bars={pipelineByStage.map(({ stage, query }, i) => ({
                        label: stage.name,
                        value: query.data?.pagination.total ?? 0,
                        color: [AMBER_BRIGHT, BLUE, VIOLET][i % 3],
                      }))}
                      trackColor={LINE}
                      labelColor="rgba(74,88,120,.65)"
                      valueColor={INK}
                      labelClassName="text-[13px] dash-mono"
                      valueClassName="text-[18px] dash-serif font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-7 pt-7 border-t border-[var(--dash-line)]">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <SectionLabel>Momentum</SectionLabel>
                  <h3 className="dash-serif text-[18px] font-medium text-[var(--dash-ink)] mt-1">Trailing trend</h3>
                </div>
                <div className="flex items-center gap-0.5 border border-[var(--dash-line)] rounded-full p-0.5 bg-[var(--dash-paper-dim)]">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTrendMonths(m)}
                      className="dash-mono text-[10.5px] font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={
                        trendMonths === m
                          ? { background: INK, color: 'var(--dash-paper)' }
                          : { color: 'var(--dash-ink-soft)', opacity: 0.55 }
                      }
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>

              {trends.isLoading && <Empty>Loading…</Empty>}
              {trends.error && <Empty>Could not load trends.</Empty>}
              {trends.data && (
                <div className={`grid gap-8 ${trends.data.revenue ? 'sm:grid-cols-2' : ''}`}>
                  <TrendChart
                    labels={trends.data.months.map(formatMonthLabel)}
                    series={[
                      { label: 'Leads', color: AMBER_BRIGHT, data: trends.data.leads.map((m) => m.count) },
                      { label: 'Opportunities', color: BLUE, data: trends.data.opportunities.map((m) => m.count) },
                      { label: 'Customers', color: TEAL, data: trends.data.customers.map((m) => m.count) },
                    ]}
                    gridColor={LINE}
                    axisTextColor="rgba(74,88,120,.5)"
                    tooltipBg={INK}
                    legendClassName="text-[13px] dash-mono"
                    tooltipClassName="text-[13px] dash-mono"
                  />
                  {trends.data.revenue && (
                    <TrendChart
                      labels={trends.data.months.map(formatMonthLabel)}
                      series={[{ label: `Revenue (${trends.data.revenue.baseCurrency})`, color: VIOLET, data: trends.data.revenue.series.map((m) => m.count) }]}
                      valueFormatter={(v) => formatMoney(String(v), trends.data!.revenue!.baseCurrency)}
                      gridColor={LINE}
                      axisTextColor="rgba(74,88,120,.5)"
                      tooltipBg={INK}
                      legendClassName="text-[13px] dash-mono"
                      tooltipClassName="text-[13px] dash-mono"
                    />
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ── Right rail ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Win rate — dark hero */}
            <div
              className="rounded-[22px] p-6 flex items-center gap-5 text-[var(--dash-paper)]"
              style={{ background: INK }}
            >
              <DonutChart
                value={winRatePct}
                label="WIN RATE"
                size={100}
                trackColor="rgba(255,255,255,.14)"
                progressColor={AMBER_BRIGHT}
                valueColor="#ffffff"
                labelColor="rgba(255,255,255,.45)"
                fontFamily="'Fraunces', Georgia, serif"
              />
              <div className="flex flex-col gap-1.5 min-w-0">
                <h3 className="dash-serif text-[17px] font-medium leading-tight">Opportunity win rate</h3>
                <p className="text-[12px] text-[var(--dash-paper)]/55 leading-relaxed">
                  {funnel ? `${funnel.opportunities.won} won of ${funnel.opportunities.won + funnel.opportunities.lost} decided this period.` : 'Loading…'}
                </p>
              </div>
            </div>

            {/* Marketing */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Marketing</SectionLabel>
                <Link to="/campaigns" className="dash-underline-grow text-[11.5px] font-medium text-[var(--dash-ink-soft)]/70 hover:text-[var(--dash-ink)] transition-colors">
                  Detail
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SectionLabel>Campaigns</SectionLabel>
                  <div className="dash-serif text-[26px] font-medium mt-1" style={{ color: BLUE }}>
                    {campaignsTotal.data ? campaignsTotal.data.pagination.total : '—'}
                  </div>
                  {campaigns.data && (
                    <Link to="/campaigns?status=active" className="text-[11.5px] font-medium mt-0.5 block" style={{ color: AMBER }}>
                      {campaigns.data.pagination.total} active
                    </Link>
                  )}
                </div>
                <div>
                  <SectionLabel>Referrals</SectionLabel>
                  <div className="dash-serif text-[26px] font-medium mt-1" style={{ color: TEAL }}>
                    {referrals.data ? referrals.data.pagination.total : '—'}
                  </div>
                  <Link to="/referrals" className="text-[11.5px] font-medium mt-0.5 block" style={{ color: VIOLET }}>
                    View all
                  </Link>
                </div>
              </div>
            </Card>

            {/* Upcoming follow-ups */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Upcoming Follow-ups</SectionLabel>
                <Link to="/follow-ups?status=open" className="dash-underline-grow text-[11.5px] font-medium text-[var(--dash-ink-soft)]/70 hover:text-[var(--dash-ink)] transition-colors">
                  Open
                </Link>
              </div>
              {followUps.isLoading && <Empty>Loading…</Empty>}
              {followUps.error && <Empty>Could not load follow-ups.</Empty>}
              {followUps.data && followUps.data.items.length === 0 && <Empty>No open follow-ups.</Empty>}
              {followUps.data && followUps.data.items.length > 0 && (
                <div className="flex flex-col divide-y divide-[var(--dash-line)]">
                  {followUps.data.items.map((f) => {
                    const overdue = new Date(f.dueAt) < new Date();
                    const linkedLabel = f.leadName ?? f.opportunityTitle ?? f.customerName;
                    return (
                      <div key={f.id} className="flex items-center gap-2.5 py-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: overdue ? `${RUST}1a` : 'var(--dash-paper-dim)', color: overdue ? RUST : 'var(--dash-ink-soft)' }}
                        >
                          <IconClock />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                          <span className="text-[12.5px] font-semibold text-[var(--dash-ink)] truncate">{f.title}</span>
                          <span className="text-[11px] text-[var(--dash-ink-soft)]/55 truncate">{linkedLabel ?? 'Unlinked'} · due {formatDate(f.dueAt)}</span>
                        </div>
                        {overdue && (
                          <span className="dash-mono shrink-0 text-[9.5px] font-medium tracking-wide uppercase rounded-full px-2 py-0.5" style={{ background: `${RUST}1a`, color: RUST }}>
                            Overdue
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Pipeline ──────────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3 pb-4 border-b border-[var(--dash-line)]">
            <div>
              <SectionLabel>Pipeline</SectionLabel>
              <h2 className="dash-serif text-[26px] font-medium text-[var(--dash-ink)] mt-1">Where the deals are</h2>
            </div>
            <Link to="/opportunities" className="dash-underline-grow text-[12.5px] font-medium text-[var(--dash-ink-soft)]/70 hover:text-[var(--dash-ink)] transition-colors">
              View all opportunities
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-[1100px]:grid-cols-1">
            {pipelineByStage.map(({ stage, query }, i) => (
              <Card key={stage.key} className="p-5 flex flex-col gap-3">
                <Link to={`/opportunities?stage=${stage.key}`} className="flex items-center gap-2.5 group/stage pb-3 border-b border-[var(--dash-line)]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: [AMBER_BRIGHT, BLUE, VIOLET][i % 3] }} />
                  <span className="flex-1 text-[13.5px] font-semibold text-[var(--dash-ink)] group-hover/stage:underline">{stage.name}</span>
                  <span className="dash-mono text-[13px] font-medium text-[var(--dash-ink-soft)]/50">
                    {query.data ? String(query.data.pagination.total).padStart(2, '0') : '—'}
                  </span>
                </Link>

                {query.isLoading && <Empty>Loading…</Empty>}
                {query.error && <Empty>Could not load.</Empty>}
                {query.data && query.data.items.length === 0 && <Empty>No opportunities in this stage.</Empty>}

                {query.data?.items.map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/opportunities/${opp.id}`}
                    className="rounded-2xl p-3.5 flex flex-col gap-2 bg-[var(--dash-paper-dim)] hover:bg-[var(--dash-line)]/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full text-[10.5px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: INK, color: 'var(--dash-paper)' }}
                      >
                        {opp.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-[13px] font-semibold text-[var(--dash-ink)] min-w-0 truncate">{opp.title}</span>
                    </div>
                    <p className="dash-mono text-[12px] text-[var(--dash-ink-soft)]/70">{formatMoney(opp.estimatedValue, opp.currency)}</p>
                    <div className="flex items-center justify-between text-[10.5px] text-[var(--dash-ink-soft)]/45">
                      <span>{opp.expectedCloseDate ? `Closes ${formatDate(opp.expectedCloseDate)}` : 'No close date'}</span>
                    </div>
                  </Link>
                ))}

                {query.data && query.data.pagination.total > query.data.items.length && (
                  <Link
                    to={`/opportunities?stage=${stage.key}`}
                    className="mt-auto text-[12px] font-medium py-2.5 rounded-xl transition-colors text-[var(--dash-ink-soft)]/60 hover:bg-[var(--dash-paper-dim)] hover:text-[var(--dash-ink)] text-center"
                  >
                    View all {query.data.pagination.total} {stage.name.toLowerCase()}
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* ── Recent leads ──────────────────────────────────────────────── */}
        <div className="mt-10">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Recent Leads</SectionLabel>
              <Link to="/leads" className="dash-underline-grow text-[12.5px] font-medium text-[var(--dash-ink-soft)]/70 hover:text-[var(--dash-ink)] transition-colors">
                View all
              </Link>
            </div>
            {leads.isLoading && <Empty>Loading…</Empty>}
            {leads.error && <Empty>Could not load leads.</Empty>}
            {leads.data && leads.data.items.length === 0 && <Empty>No leads yet.</Empty>}
            {leads.data && leads.data.items.length > 0 && (
              <div className="flex flex-col divide-y divide-[var(--dash-line)]">
                {leads.data.items.map((lead) => (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className="flex items-center gap-3.5 py-3.5 hover:bg-[var(--dash-paper-dim)] -mx-3 px-3 rounded-xl transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full text-[12px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: INK, color: 'var(--dash-paper)' }}
                    >
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <span className="text-[13.5px] font-semibold text-[var(--dash-ink)] truncate">{lead.name}</span>
                      <span className="text-[11.5px] text-[var(--dash-ink-soft)]/55 truncate">{lead.company ?? lead.email}</span>
                    </div>
                    <Badge value={lead.stage} />
                    <span className="dash-mono text-[11px] text-[var(--dash-ink-soft)]/45 text-right shrink-0 whitespace-nowrap">{formatDate(lead.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── AI Revenue Forecast ───────────────────────────────────────── */}
        <div className="mt-10">
          <ForecastPanel />
        </div>
      </div>
    </AppShell>
  );
}
