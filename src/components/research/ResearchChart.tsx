import { useMemo, useRef, useState } from 'react';

export interface ChartSeries {
  label: string;
  color: string;
  points: { x: number; y: number }[];
}

interface Props {
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
  cursorX?: number;
  onClickX?: (x: number) => void;
  height?: number;
}

const W = 640;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 30;

/** Generic multi-series SVG line chart used by the parameter sweep and experiment-comparison views. Pure presentation — all data is computed elsewhere from the deterministic model. */
export function ResearchChart({ series, xLabel, yLabel, cursorX, onClickX, height = 260 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; entries: { label: string; color: string; y: number }[] } | null>(null);

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.x < xmin) xmin = p.x;
        if (p.x > xmax) xmax = p.x;
        if (p.y < ymin) ymin = p.y;
        if (p.y > ymax) ymax = p.y;
      }
    }
    if (!isFinite(xmin)) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    if (xmin === xmax) xmax = xmin + 1;
    if (ymin === ymax) ymax = ymin + 1;
    return { xMin: xmin, xMax: xmax, yMin: ymin, yMax: ymax };
  }, [series]);

  const innerW = W - PAD_L - PAD_R;
  const innerH = height - PAD_T - PAD_B;
  const xFor = (x: number) => PAD_L + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const yFor = (y: number) => PAD_T + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH;

  const findNearest = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || series.length === 0) return null;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    const dataX = xMin + ((relX - PAD_L) / innerW) * (xMax - xMin);
    let best = series[0].points[0]?.x ?? 0;
    let bestDist = Infinity;
    for (const s of series) {
      for (const p of s.points) {
        const dist = Math.abs(p.x - dataX);
        if (dist < bestDist) {
          bestDist = dist;
          best = p.x;
        }
      }
    }
    return best;
  };

  const handleMove = (clientX: number) => {
    const nearestX = findNearest(clientX);
    if (nearestX == null) return;
    const entries = series
      .map((s) => {
        const p = s.points.reduce((acc, cur) => (Math.abs(cur.x - nearestX) < Math.abs(acc.x - nearestX) ? cur : acc), s.points[0]);
        return p ? { label: s.label, color: s.color, y: p.y } : null;
      })
      .filter((e): e is { label: string; color: string; y: number } => e != null);
    setHover({ x: nearestX, entries });
  };

  const gridLinesY = 4;

  return (
    <div>
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        style={{ height, cursor: onClickX ? 'crosshair' : 'default' }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          if (!onClickX) return;
          const x = findNearest(e.clientX);
          if (x != null) onClickX(x);
        }}
        role="img"
        aria-label={`${yLabel} vs ${xLabel}`}
      >
        {Array.from({ length: gridLinesY + 1 }, (_, i) => {
          const y = PAD_T + (innerH * i) / gridLinesY;
          const val = yMax - ((yMax - yMin) * i) / gridLinesY;
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border-faint)" strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 3} textAnchor="end" className="chart-axis-label">
                {Math.abs(val) >= 100 ? val.toFixed(0) : val.toFixed(2)}
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={height - 6} textAnchor="middle" className="chart-axis-label">
          {xLabel}
        </text>
        <text x={12} y={12} className="chart-axis-label">
          {yLabel}
        </text>

        {series.map((s) => {
          const path = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.x).toFixed(2)},${yFor(p.y).toFixed(2)}`).join(' ');
          return <path key={s.label} d={path} fill="none" stroke={s.color} strokeWidth={2} />;
        })}

        {cursorX != null && (
          <line x1={xFor(cursorX)} y1={PAD_T} x2={xFor(cursorX)} y2={PAD_T + innerH} stroke="var(--text-primary)" strokeWidth={1} opacity={0.6} />
        )}
        {hover && (
          <line x1={xFor(hover.x)} y1={PAD_T} x2={xFor(hover.x)} y2={PAD_T + innerH} stroke="var(--text-secondary)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
        )}
      </svg>
      <div className="chart-hover-readout" style={{ textAlign: 'left' }}>
        {hover
          ? `${xLabel} = ${hover.x.toFixed(4)} · ${hover.entries.map((e) => `${e.label}: ${e.y.toFixed(4)}`).join(' · ')}`
          : ' '}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
        {series.map((s) => (
          <span key={s.label} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
