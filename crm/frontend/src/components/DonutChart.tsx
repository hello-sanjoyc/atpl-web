interface Props {
  value: number; // 0–100
  label: string;
  size?: number;
}

export function DonutChart({ value, label, size = 120 }: Props) {
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const gap = circ - filled;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label={`${value}% of goal`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e6f0" strokeWidth="10" />
      {/* Progress — lime accent */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#f86223"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circ / 4}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f1117" fontFamily="Inter, sans-serif">{value}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="Inter, sans-serif" letterSpacing="0.8">{label}</text>
    </svg>
  );
}
