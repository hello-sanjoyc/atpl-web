import { useState } from 'react';

interface Series {
  label: string;
  color: string;
  data: number[];
  dashed?: boolean;
}

interface Props {
  labels: string[];
  series: Series[];
  yFormatter?: (v: number) => string;
}

export function LineChart({ labels, series, yFormatter = (v) => `$${v / 1000}k` }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; values: { label: string; color: string; value: number }[] } | null>(null);

  const allValues = series.flatMap(s => s.data);
  const rawMax = Math.max(...allValues);
  const rawMin = 0;
  const yMax = Math.ceil(rawMax / 25000) * 25000;
  const yTicks = [0, 21000, 25000, 38000, 50000, 100000].filter(v => v <= yMax + 10000);

  const W = 600, H = 220;
  const padL = 48, padR = 16, padT = 16, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = labels.length;
  const stepX = chartW / (n - 1);

  function toCoord(v: number, i: number) {
    const x = padL + i * stepX;
    const y = padT + chartH - ((v - rawMin) / (yMax - rawMin)) * chartH;
    return { x, y };
  }

  function buildPath(data: number[]) {
    return data.map((v, i) => {
      const { x, y } = toCoord(v, i);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  function buildArea(data: number[], color: string, id: string) {
    const pts = data.map((v, i) => toCoord(v, i));
    const linePts = pts.map(({ x, y }) => `${x} ${y}`).join(' L ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = `M ${first.x} ${first.y} L ${linePts} L ${last.x} ${padT + chartH} L ${first.x} ${padT + chartH} Z`;
    return { area, id, color };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width) - padL;
    const idx = Math.round(Math.max(0, Math.min(n - 1, mx / stepX)));
    const { x, y } = toCoord(series[0].data[idx], idx);
    setTooltip({
      x, y,
      label: labels[idx],
      values: series.map(s => ({ label: s.label, color: s.color, value: s.data[idx] })),
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: 'visible', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        aria-label="Commission performance chart"
      >
        <defs>
          {series.map(s => {
            const { id, color } = buildArea(s.data, s.color, `grad-${s.label}`);
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Y grid lines */}
        {yTicks.map(tick => {
          const y = padT + chartH - ((tick - rawMin) / (yMax - rawMin)) * chartH;
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e6f0" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {yFormatter(tick)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        {series.map(s => {
          const { area, id } = buildArea(s.data, s.color, `grad-${s.label}`);
          return <path key={s.label + '-area'} d={area} fill={`url(#${id})`} />;
        })}

        {/* Lines */}
        {series.map(s => (
          <path
            key={s.label + '-line'}
            d={buildPath(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* X axis labels */}
        {labels.map((lbl, i) => {
          const x = padL + i * stepX;
          return (
            <text key={lbl} x={x} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {lbl}
            </text>
          );
        })}

        {/* Tooltip dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r={4} fill="#f86223" stroke="#fff" strokeWidth="2" />
        )}
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div
          className="absolute -translate-x-1/2 -translate-y-[120%] bg-[#00308a] text-white rounded-lg px-2.5 py-1.5 text-xs pointer-events-none whitespace-nowrap z-10 shadow-[0_4px_12px_rgba(0,0,0,.2)]"
          style={{
            top: (tooltip.y / 220) * 100 + '%',
            left: (tooltip.x / 600) * 100 + '%',
          }}
        >
          <div className="font-semibold mb-0.5">{tooltip.label}</div>
          {tooltip.values.map(v => (
            <div key={v.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: v.color }}
              />
              <span>{yFormatter(v.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
