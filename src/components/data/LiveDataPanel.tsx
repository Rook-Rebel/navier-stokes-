import { useSimStore } from '../../hooks/useSimStore';
import { computeDiagnostics, CRITICAL_TIME, MAX_SIM_TIME } from '../../utils/flowField';
import { useDiagnosticCurve } from '../../hooks/useDiagnosticCurve';
import { Sparkline } from '../common/Sparkline';

function fmt(v: number, digits = 3): string {
  if (!isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 100) return v.toFixed(1);
  return v.toFixed(digits);
}

export function LiveDataPanel() {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const curve = useDiagnosticCurve(params);
  const d = computeDiagnostics(t, params);
  const cursorFraction = t / MAX_SIM_TIME;
  const dangerZone = t > 0.9;

  const primaryCells: { label: string; value: string; series: number[]; warn?: boolean }[] = [
    { label: 'მაქსიმალური სიჩქარე', value: fmt(d.maxVelocity), series: curve.map((c) => c.maxVelocity), warn: dangerZone },
    { label: 'ვორტიციტეტის ინდექსი', value: fmt(d.vorticityIndex), series: curve.map((c) => c.vorticityIndex), warn: dangerZone },
    { label: 'ბირთვის რადიუსი', value: fmt(d.radialScale), series: curve.map((c) => c.radialScale) },
    { label: 'ღერძული გაწელვა', value: fmt(d.axialScale), series: curve.map((c) => c.axialScale), warn: dangerZone },
    { label: 'კინეტიკური ენერგიის ინდექსი', value: fmt(d.kineticEnergyIndex), series: curve.map((c) => c.kineticEnergyIndex) },
  ];

  const secondaryCells: { label: string; value: string }[] = [
    { label: 'დრო t', value: fmt(t, 4) },
    { label: 'კრიტიკული დრო T', value: CRITICAL_TIME.toFixed(3) },
    { label: 'სიბლანტე ν', value: d.viscosity.toFixed(3) },
  ];

  return (
    <div className="glass-panel">
      <div style={{ padding: '14px 18px 0' }}>
        <div className="side-panel-title" style={{ marginBottom: 4 }}>
          <span>ცოცხალი მონაცემთა პანელი</span>
        </div>
      </div>

      <div className="hero-metric">
        <span className="hero-metric-label">T − t · კრიტიკულ დრომდე</span>
        <span className={`hero-metric-value mono${dangerZone ? ' warn' : ''}`}>{fmt(d.timeToSingularity, 4)}</span>
        <Sparkline
          values={curve.map((c) => c.timeToSingularity)}
          cursorFraction={cursorFraction}
          color={dangerZone ? 'var(--accent-warm)' : undefined}
          width={220}
          height={30}
        />
      </div>

      <div className="data-panel">
        {primaryCells.map((c) => (
          <div className="data-cell" key={c.label}>
            <span className="data-cell-label">{c.label}</span>
            <span className={`data-cell-value mono${c.warn ? ' warn' : ''}`}>{c.value}</span>
            <Sparkline values={c.series} cursorFraction={cursorFraction} color={c.warn ? 'var(--accent-warm)' : undefined} />
          </div>
        ))}
      </div>

      <div className="data-panel-secondary">
        {secondaryCells.map((c) => (
          <div key={c.label} className="data-cell-secondary">
            <span>{c.label}</span>
            <b className="mono">{c.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
