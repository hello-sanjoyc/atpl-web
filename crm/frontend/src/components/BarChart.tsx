interface Bar {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  bars: Bar[];
  /** Formats the value shown at the end of each bar. */
  valueFormatter?: (v: number) => string;
  trackColor?: string;
  labelColor?: string;
  valueColor?: string;
  /** Extra classes for the label span, e.g. to override font-size/family. */
  labelClassName?: string;
  /** Extra classes for the value span, e.g. to override font-size/family. */
  valueClassName?: string;
}

const DEFAULT_COLOR = '#f86223';

/** Simple horizontal bar chart — each bar's width is proportional to the largest value. */
export function BarChart({
  bars,
  valueFormatter = (v) => String(v),
  trackColor = '#f3f4f6',
  labelColor = '#6b7280',
  valueColor = '#0f1117',
  labelClassName = 'text-[18px]',
  valueClassName = 'text-[18px] font-semibold',
}: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex flex-col gap-3">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className={`w-36 shrink-0 truncate ${labelClassName}`} style={{ color: labelColor }}>{b.label}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: trackColor }}>
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${(b.value / max) * 100}%`, background: b.color ?? DEFAULT_COLOR }}
            />
          </div>
          <span className={`w-10 text-right shrink-0 ${valueClassName}`} style={{ color: valueColor }}>{valueFormatter(b.value)}</span>
        </div>
      ))}
    </div>
  );
}
