import { useRef, useState } from 'react';
import { MAX_SIM_TIME } from '../../utils/flowField';
import { useSimStore } from '../../hooks/useSimStore';

interface TimeSeriesChartProps {
  title: string;
  data: { t: number; value: number }[];
  color: string;
  currentT: number;
  yLabel: string;
  valueFormatter?: (v: number) => string;
}

const W = 320;
const H = 150;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 8;

export function TimeSeriesChart({ title, data, color, currentT, yLabel, valueFormatter }: TimeSeriesChartProps) {
  const setT = useSimStore((s) => s.setT);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1e-9);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1e-9);

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xFor = (t: number) => PAD_L + (t / MAX_SIM_TIME) * innerW;
  const yFor = (v: number) => PAD_T + innerH - ((v - min) / span) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xFor(d.t).toFixed(2)},${yFor(d.value).toFixed(2)}`).join(' ');
  const areaPath = `${path} L${xFor(data[data.length - 1].t).toFixed(2)},${(PAD_T + innerH).toFixed(2)} L${xFor(0).toFixed(2)},${(PAD_T + innerH).toFixed(2)} Z`;

  const cursorX = xFor(currentT);

  const handlePointer = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    const frac = Math.min(Math.max((relX - PAD_L) / innerW, 0), 1);
    const idx = Math.round(frac * (data.length - 1));
    setHoverIdx(idx);
  };

  const handleClick = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    const frac = Math.min(Math.max((relX - PAD_L) / innerW, 0), 1);
    setT(frac * MAX_SIM_TIME);
  };

  const hovered = hoverIdx != null ? data[hoverIdx] : null;
  const fmt = valueFormatter ?? ((v: number) => v.toFixed(3));

  return (
    <div className="glass-panel chart-card">
      <div className="chart-card-title">{title}</div>
      <div className="chart-hover-readout">
        {hovered ? `t=${hovered.t.toFixed(3)} · ${yLabel}=${fmt(hovered.value)}` : ' '}
      </div>
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={(e) => handlePointer(e.clientX)}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={(e) => handleClick(e.clientX)}
        role="img"
        aria-label={`${title} — გრაფიკი, დაწკაპუნებით დროის შეცვლა`}
      >
        <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke="var(--border-faint)" strokeWidth={1} />
        <path d={areaPath} fill={color} opacity={0.12} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} />
        <line x1={cursorX} y1={PAD_T} x2={cursorX} y2={PAD_T + innerH} stroke="var(--text-primary)" strokeWidth={1.2} opacity={0.75} />
        <circle cx={cursorX} cy={yFor(data[Math.min(data.length - 1, Math.round((currentT / MAX_SIM_TIME) * (data.length - 1)))].value)} r={3} fill={color} />
        {hovered && (
          <line x1={xFor(hovered.t)} y1={PAD_T} x2={xFor(hovered.t)} y2={PAD_T + innerH} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
        )}
      </svg>
    </div>
  );
}
