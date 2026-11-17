interface SparklineProps {
  values: number[];
  cursorFraction: number;
  color?: string;
  width?: number;
  height?: number;
}

/** A tiny inline SVG line chart with a moving cursor — used inside data-panel cells. */
export function Sparkline({ values, cursorFraction, color = 'var(--accent-primary)', width = 108, height = 26 }: SparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1e-9);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1e-9);

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const cx = Math.min(Math.max(cursorFraction, 0), 1) * width;

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.4} opacity={0.85} />
      <line x1={cx} y1={0} x2={cx} y2={height} stroke="var(--text-primary)" strokeWidth={1} opacity={0.55} />
    </svg>
  );
}
