import { useState } from 'react';

interface Series {
  label: string;
  color: string;
  data: number[];
}

interface Props {
  labels: string[];
  series: Series[];
  valueFormatter?: (v: number) => string;
  /** Formats the compact y-axis tick labels. Defaults to a short "45k"-style abbreviation. */
  axisFormatter?: (v: number) => string;
  gridColor?: string;
  axisTextColor?: string;
  tooltipBg?: string;
  /** Extra classes for the legend labels, e.g. to override font-size/family. */
  legendClassName?: string;
  /** Extra classes for the hover tooltip/popover text, e.g. to override font-size/family. */
  tooltipClassName?: string;
}

function defaultAxisFormatter(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
  return String(Math.round(v));
}

/** A small multi-series line/area chart with a y-axis scaled to the data (unlike LineChart, which is fixed to a dollar scale). */
export function TrendChart({
  labels,
  series,
  valueFormatter = (v) => String(Math.round(v)),
  axisFormatter = defaultAxisFormatter,
  gridColor = '#e2e6f0',
  axisTextColor = '#9ca3af',
  tooltipBg = '#00308a',
  legendClassName = 'text-[17px]',
  tooltipClassName = 'text-[18px]',
}: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; label: string; values: { label: string; color: string; value: number }[] } | null>(null);

  const allValues = series.flatMap((s) => s.data);
  const rawMax = Math.max(1, ...allValues);
  const yMax = Math.ceil(rawMax * 1.2);
  const yTicks = [0, Math.round(yMax / 2), yMax];

  const W = 600, H = 200;
  const padL = 40, padR = 12, padT = 14, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = labels.length;
  const stepX = n > 1 ? chartW / (n - 1) : 0;

  function toCoord(v: number, i: number) {
    const x = padL + i * stepX;
    const y = padT + chartH - (v / yMax) * chartH;
    return { x, y };
  }

  function buildLine(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toCoord(v, i).x} ${toCoord(v, i).y}`).join(' ');
  }

  function buildArea(data: number[]) {
    const pts = data.map((v, i) => toCoord(v, i));
    const mid = pts.map((p) => `${p.x} ${p.y}`).join(' L ');
    return `M ${pts[0].x} ${padT + chartH} L ${mid} L ${pts[pts.length - 1].x} ${padT + chartH} Z`;
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width) - padL;
    const idx = Math.round(Math.max(0, Math.min(n - 1, stepX > 0 ? mx / stepX : 0)));
    const { x } = toCoord(0, idx);
    setTooltip({ x, label: labels[idx], values: series.map((s) => ({ label: s.label, color: s.color, value: s.data[idx] })) });
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className={legendClassName} style={{ color: axisTextColor }}>{s.label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: 'visible', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        aria-label="Trend chart"
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.label} id={`trend-gradient-${s.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {yTicks.map((tick) => {
          const y = padT + chartH - (tick / yMax) * chartH;
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="13.5" fill={axisTextColor}>{axisFormatter(tick)}</text>
            </g>
          );
        })}

        {series.length === 1 &&
          series.map((s) => <path key={s.label + '-area'} d={buildArea(s.data)} fill={`url(#trend-gradient-${s.label})`} />)}

        {series.map((s) => (
          <path key={s.label + '-line'} d={buildLine(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {labels.map((lbl, i) => (
          <text key={lbl + i} x={padL + i * stepX} y={H - 8} textAnchor="middle" fontSize="13.5" fill={axisTextColor}>
            {lbl}
          </text>
        ))}

        {tooltip && <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + chartH} stroke={gridColor} strokeWidth="1" strokeDasharray="2 2" />}
      </svg>

      {tooltip && (
        <div
          className={`absolute -translate-y-full text-white rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap z-10 shadow-[0_4px_12px_rgba(0,0,0,.2)] ${tooltipClassName}`}
          style={{ top: '0%', left: `${(tooltip.x / W) * 100}%`, background: tooltipBg }}
        >
          <div className="font-semibold mb-0.5">{tooltip.label}</div>
          {tooltip.values.map((v) => (
            <div key={v.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.color }} />
              <span>{v.label}: {valueFormatter(v.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
