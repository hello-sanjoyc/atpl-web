import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/StatCard';
import { Sparkline } from '../../components/Sparkline';
import { LineChart } from '../../components/LineChart';
import { DonutChart } from '../../components/DonutChart';
import { useAuth } from '../../app/AuthContext';

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACTIVE_LEADS_SPARK  = [40, 55, 48, 65, 72, 60, 80, 90, 85, 100, 110, 128];
const PENDING_VOL_SPARK   = [2, 3, 2.5, 4, 5, 4.5, 5.5, 5, 6, 6.5, 6.2, 6.8];
const AVG_DAYS_SPARK      = [28, 30, 27, 32, 26, 25, 24, 28, 25, 24, 26, 23];
const GCI_SPARK           = [80, 95, 100, 115, 120, 140, 160, 170, 180, 190, 200, 214.6];

const CHART_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const CHART_2026   = [12000, 20000, 18000, 38400, 42000, 50000, 65000, 72000];
const CHART_2025   = [8000,  12000, 14000, 20000, 22000, 28000, 35000, 40000];

const PIPELINE_COLS = [
  {
    stage: 'Qualified', color: '#f86223', count: 31,
    cards: [
      { name: 'Carter', tag: 'Warm', tagColor: 'warm', desc: 'First home · $450–520k', source: 'Zillow', age: '2d' },
    ],
    viewAll: 'View all 31 qualified',
  },
  {
    stage: 'Touring', color: '#f86223', count: 19,
    cards: [
      { name: 'Ethan',      tag: 'Hot', tagColor: 'hot', desc: 'Buyer · loft downtown · pre-approved', source: '2nd tour Thu', age: '4h ago' },
      { name: 'Sam Fuller', tag: 'Warm', tagColor: 'warm', desc: 'Buyer · needs yard · flexible on area', source: 'Toured 2 homes', age: '2d ago' },
    ],
    viewAll: 'View all 17 touring',
  },
  {
    stage: 'Under offer', color: '#f86223', count: 9,
    cards: [
      { name: 'Mason', tag: 'Hot', tagColor: 'hot', desc: 'Offer $612k on 24 Linden · countered', source: 'Awaiting reply', age: '2d' },
      { name: 'Logan', tag: 'Hot', tagColor: 'hot', desc: 'Offer $1.02M on Alder Ct · inspection', source: 'Contingency ends Fri', age: '6h' },
    ],
    viewAll: 'View all 07 under offer',
  },
  {
    stage: 'Closing', color: '#f86223', count: 6, dark: true,
    cards: [
      { name: 'Linh Nguyen',    desc: '88 Dockside #4B · $542k · closes', progress: 80 },
      { name: 'Harper-Singh',   desc: '310 Crescent Way · $895k · closes Aug 12', progress: 95 },
    ],
    viewAll: 'View all closing · $3.2M',
    potential: '$3.2M',
  },
];

const AGENDA = [
  { time: '9:30',  period: 'AM', icon: 'home',    title: 'Showing · 212 Fern Ave',         sub: 'Kim & Alex Park · confirmed',      tag: 'Hot',          tagColor: 'hot' },
  { time: '11:00', period: 'AM', icon: 'camera',  title: 'Listing photos · Alder Ct',      sub: 'Photographer on site',             tag: 'Prep needed',  tagColor: 'prep' },
  { time: '1:30',  period: 'PM', icon: 'alert',   title: 'Inspection · 88 Dockside #4B',   sub: 'Nguyen · contingency ends Fri',    tag: 'Critical',     tagColor: 'critical' },
  { time: '2:45',  period: 'PM', icon: 'doc',     title: 'Offer review · 19 Bell Hollow Ln', sub: 'Review counteroffer · $918k',    tag: 'Urgent',       tagColor: 'urgent' },
  { time: '4:00',  period: 'PM', icon: 'phone',   title: 'Buyer call · R. Ortiz',           sub: 'Pre-approval next steps',         tag: 'Call',         tagColor: 'call' },
  { time: '5:15',  period: 'PM', icon: 'bell',    title: 'Follow-up · Melissa Tran',        sub: 'Counter expires tonight',          tag: 'Overdue',      tagColor: 'overdue' },
  { time: '9:30',  period: 'PM', icon: 'eye',     title: 'Listing review · 7 Marina Gate #1204', sub: 'Review new buyer interest · 3 requests', tag: 'New', tagColor: 'new' },
];

type Period = 'Week' | 'Month' | 'Year';

// ─── Tag colour map ───────────────────────────────────────────────────────────

const TAG_CLASSES: Record<string, string> = {
  hot:      'bg-[#fff3e0] text-[#e65100]',
  warm:     'bg-[#e8f5e9] text-[#2e7d32]',
  critical: 'bg-[#fce4ec] text-[#c62828]',
  urgent:   'bg-[#fff8e1] text-[#e65100]',
  call:     'bg-[#e3f2fd] text-[#1565c0]',
  overdue:  'bg-[#fce4ec] text-[#c62828]',
  new:      'bg-[#f3f4f6] text-[#374151]',
  prep:     'bg-[#f3e5f5] text-[#6a1b9a]',
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconLeads() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconChartBar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function AgendaIcon({ type }: { type: string }) {
  const cls = { width: 14, height: 14, flexShrink: 0 as const };
  switch (type) {
    case 'home':   return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case 'camera': return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'alert':  return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
    case 'doc':    return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'phone':  return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.1 19.79 19.79 0 013 1.18 2 2 0 014.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" /></svg>;
    case 'bell':   return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>;
    default:       return <svg {...cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('Month');
  const [pipelineFilter, setPipelineFilter] = useState<'All 107' | 'Hot 12' | 'Stale 8'>('All 107');

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4 pt-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-1">
            <span>{today}</span>
            <span>·</span>
            <span>3 showings · 5 follow-ups today</span>
          </div>
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm" role="group" aria-label="Time period">
          {(['Week', 'Month', 'Year'] as Period[]).map(p => (
            <button
              key={p}
              className={[
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                period === p
                  ? 'bg-[#00308a] text-white'
                  : 'text-gray-500 hover:text-[#0f1117] hover:bg-[#e4e9f4]',
              ].join(' ')}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold ml-1 hover:bg-[#d94f15] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-5 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
        <StatCard
          icon={<IconLeads />}
          label="Active Leads"
          value="128"
          trend="This week"
          trendUp={true}
          sparkline={<Sparkline data={ACTIVE_LEADS_SPARK} color="#f86223" />}
        />
        <StatCard
          icon={<IconDollar />}
          label="Pending Volume"
          value="$6.8M"
          trend="18% This w…"
          trendUp={true}
          sparkline={<Sparkline data={PENDING_VOL_SPARK} color="#f86223" />}
        />
        <StatCard
          icon={<IconCalendar />}
          label="Avg Days on Market"
          value="23"
          trend="4 days vs metro"
          trendUp={false}
          sparkline={<Sparkline data={AVG_DAYS_SPARK} color="#ef4444" />}
        />
        <StatCard
          icon={<IconChartBar />}
          label="GCI · Year to Date"
          value="$214,600"
          trend="$38.4k in August so…"
          trendUp={true}
          sparkline={<Sparkline data={GCI_SPARK} color="#f86223" />}
        />
      </div>

      {/* Main row: chart + right panel */}
      <div className="grid grid-cols-[1fr_340px] gap-5 mb-5 items-start max-[1100px]:grid-cols-1">

        {/* Commission chart */}
        <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#0f1117]">Commission performance</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Monthly GCI vs last year · dotted = projected</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <span className="inline-block w-5 h-0.5 bg-[#f86223] rounded" />
                  <span>2026</span>
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <span className="inline-block w-5 h-0 border-t-[1.5px] border-dashed border-[#94a3b8]" />
                  <span>2025</span>
                </span>
              </div>
              <select className="text-[12px] text-gray-500 bg-[#f4f6fb] border-0 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer" aria-label="Select year">
                <option>This year</option>
                <option>Last year</option>
              </select>
            </div>
          </div>

          <LineChart
            labels={CHART_LABELS}
            series={[
              { label: '2026', color: '#f86223', data: CHART_2026 },
              { label: '2025', color: '#94a3b8', data: CHART_2025, dashed: true },
            ]}
            yFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`}
          />

          <div className="flex items-center gap-6 mt-5 flex-wrap">
            {[
              { label: 'Closed volume YTD', value: '$14.2M' },
              { label: 'Deals closed', value: '26' },
              { label: 'Avg sale price', value: '$546k' },
              { label: 'List-to-sale ratio', value: '98.7%' },
              { label: 'Referral rate', value: '41%' },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{s.label}</span>
                <span className="text-[15px] font-bold text-[#0f1117]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">

          {/* Goal */}
          <div className="bg-white rounded-[28px] p-5 flex items-center gap-4 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <div className="shrink-0">
              <DonutChart value={71} label="OF GOAL" size={110} />
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <h3 className="text-[14px] font-bold text-[#0f1117]">2026 goal · $300k GCI</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">$214.6k earned. On pace to hit goal by Nov 12 – 6 weeks early.</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold bg-[#e4e9f4] text-[#374151] rounded-full px-2.5 py-1">$85.4k to go</span>
                <span className="text-[11px] font-semibold bg-[#e4e9f4] text-[#374151] rounded-full px-2.5 py-1">5 closings</span>
              </div>
            </div>
          </div>

          {/* Lead sources */}
          <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-bold text-[#0f1117]">Lead sources · Aug</span>
              <button className="text-[12px] text-gray-400 hover:text-[#0f1117] transition-colors">Detail →</button>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden mb-3">
              <span className="w-[34%] bg-[#f86223]" />
              <span className="w-[26%] bg-[#fb8c5a]" />
              <span className="w-[22%] bg-[#f86223]" />
              <span className="w-[18%] bg-[#c44510]" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { dot: '#f86223', label: 'Referrals',    pct: '34%' },
                { dot: '#fb8c5a', label: 'Zillow',       pct: '26%' },
                { dot: '#f86223', label: 'Open houses',  pct: '22%' },
                { dot: '#c44510', label: 'Website',      pct: '18%' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                  <span className="text-[12px] text-gray-500 flex-1">{s.label}</span>
                  <span className="text-[12px] font-semibold text-[#0f1117]">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's agenda */}
          <div className="bg-white rounded-[28px] px-5 py-4 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-bold text-[#0f1117]">Today</span>
              <button className="text-[12px] text-gray-400 hover:text-[#0f1117] transition-colors">Aug 4 →</button>
            </div>
            <div className="flex flex-col divide-y divide-[#f0f2f7]">
              {AGENDA.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-2">
                  <div className="flex flex-col items-end w-[38px] shrink-0">
                    <span className="text-[12px] font-bold text-[#0f1117] leading-none">{item.time}</span>
                    <span className="text-[10px] text-gray-400">{item.period}</span>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-[#e4e9f4] flex items-center justify-center text-gray-500 shrink-0">
                    <AgendaIcon type={item.icon} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <span className="text-[12px] font-semibold text-[#0f1117] truncate">{item.title}</span>
                    <span className="text-[11px] text-gray-400 truncate">{item.sub}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${TAG_CLASSES[item.tagColor] ?? 'bg-gray-100 text-gray-500'}`}>
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0f2f7] text-[12px] text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>5 follow-ups due · 2 overdue</span>
              <button className="ml-auto text-[12px] text-gray-400 hover:text-[#0f1117] transition-colors">Open →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#0f1117]">Pipeline</h2>
            <span className="text-[12px] font-semibold text-gray-400 bg-white rounded-full px-2.5 py-1 shadow-sm">$9.1M potential</span>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
            {(['All 107', 'Hot 12', 'Stale 8'] as const).map(f => (
              <button
                key={f}
                className={[
                  'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                  pipelineFilter === f
                    ? 'bg-[#00308a] text-white'
                    : 'text-gray-500 hover:text-[#0f1117] hover:bg-[#e4e9f4]',
                ].join(' ')}
                onClick={() => setPipelineFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
          {PIPELINE_COLS.map(col => (
            <div
              key={col.stage}
              className={[
                'rounded-[28px] p-4 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,.08)]',
                col.dark ? 'bg-[#002266]' : 'bg-white',
              ].join(' ')}
            >
              {/* Col header */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dark ? '#fff' : col.color }} />
                <span className={`flex-1 text-[13px] font-bold ${col.dark ? 'text-white' : 'text-[#0f1117]'}`}>{col.stage}</span>
                <span className={`text-[13px] font-bold ${col.dark ? 'text-white/50' : 'text-gray-400'}`}>
                  {String(col.count).padStart(2, '0')}
                </span>
              </div>

              {col.cards.map((card, i) => (
                <div
                  key={i}
                  className={[
                    'rounded-xl p-3 flex flex-col gap-2',
                    col.dark ? 'bg-white/[.07]' : 'bg-[#e4e9f4]',
                  ].join(' ')}
                >
                  {'progress' in card ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#002266] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {card.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-semibold text-white">{card.name}</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">{card.desc}</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">Escrow progress</span>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#f86223] rounded-full" style={{ width: `${card.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-white/50 font-semibold">{card.progress}%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white text-[#374151] text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {card.name.charAt(0)}
                        </div>
                        <span className="flex-1 text-[13px] font-semibold text-[#0f1117] min-w-0 truncate">{card.name}</span>
                        {'tag' in card && (
                          <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${TAG_CLASSES[card.tagColor] ?? 'bg-gray-100 text-gray-500'}`}>
                            {card.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{card.desc}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{'source' in card ? card.source : ''}</span>
                        <span>{'age' in card ? card.age : ''}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <button className={[
                'mt-auto text-[12px] font-medium py-2 rounded-xl transition-colors',
                col.dark
                  ? 'text-white/40 hover:bg-white/[.06] hover:text-white/70'
                  : 'text-gray-400 hover:bg-[#e4e9f4] hover:text-[#0f1117]',
              ].join(' ')}>
                {col.viewAll}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
