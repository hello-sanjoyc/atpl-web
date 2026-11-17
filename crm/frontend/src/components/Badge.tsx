import { humanize } from './form/fields';

type Tone = 'neutral' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'lime';

const TONE: Record<Tone, string> = {
  neutral: 'bg-[#f3f4f6] text-[#374151]',
  green: 'bg-[#e8f5e9] text-[#2e7d32]',
  blue: 'bg-[#e3f2fd] text-[#1565c0]',
  amber: 'bg-[#fff3e0] text-[#e65100]',
  red: 'bg-[#fce4ec] text-[#c62828]',
  purple: 'bg-[#f3e5f5] text-[#6a1b9a]',
  lime: 'bg-[#fde8dd] text-[#9a3b12]',
};

// Maps known enum values to a tone. Unknown values fall back to neutral.
const VALUE_TONE: Record<string, Tone> = {
  // generic status
  active: 'green',
  open: 'blue',
  completed: 'green',
  won: 'green',
  paused: 'amber',
  ended: 'neutral',
  cancelled: 'neutral',
  churned: 'red',
  lost: 'red',
  // lead stages
  new_lead: 'blue',
  contacted: 'blue',
  qualified: 'green',
  discovery_scheduled: 'purple',
  discovery_completed: 'purple',
  proposal_sent: 'amber',
  negotiation: 'amber',
  nurturing: 'neutral',
  // priority
  high: 'red',
  medium: 'amber',
  low: 'neutral',
  // qualification
  unqualified: 'neutral',
  disqualified: 'red',
  // revenue kind
  invoiced: 'blue',
  collected: 'green',
};

export function Badge({
  value,
  tone,
  label,
}: {
  value: string;
  tone?: Tone;
  label?: string;
}) {
  const resolved = tone ?? VALUE_TONE[value] ?? 'neutral';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${TONE[resolved]}`}
    >
      {label ?? humanize(value)}
    </span>
  );
}
