import { useState } from 'react';
import { useExperimentStore } from '../../hooks/useExperimentStore';
import { ResearchChart, type ChartSeries } from './ResearchChart';
import type { ExperimentRun } from '../../types/experiment';

const COMPARE_COLORS = ['#4fa8db', '#c98a4a', '#a184c9', '#3aa08c'];

type MetricKey = 'maxVelocity' | 'maxVorticity' | 'coreRadius' | 'kineticEnergyIndex' | 'stretchFactor';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'maxVelocity', label: 'მაქსიმალური სიჩქარე' },
  { key: 'maxVorticity', label: 'ვორტიციტეტი' },
  { key: 'coreRadius', label: 'ბირთვის რადიუსი' },
  { key: 'kineticEnergyIndex', label: 'ენერგიის ინდექსი' },
  { key: 'stretchFactor', label: 'ღერძული გაწელვა' },
];

const PARAM_LABELS: { key: keyof ExperimentRun['metadata']['params']; label: string }[] = [
  { key: 'viscosity', label: 'ν' },
  { key: 'radialCompression', label: 'შეკუმშვა' },
  { key: 'axialStretch', label: 'გაწელვა' },
  { key: 'rotationIntensity', label: 'ბრუნვა' },
  { key: 'forcingInfluence', label: 'გარე ძალა' },
];

/** "ექსპერიმენტების შედარება" — overlays 2-4 saved runs on one chart with a consistent, non-rainbow palette. */
export function CompareExperimentsPanel() {
  const runs = useExperimentStore((s) => s.runs);
  const selected = useExperimentStore((s) => s.selectedForCompare);
  const toggle = useExperimentStore((s) => s.toggleCompareSelection);
  const [metric, setMetric] = useState<MetricKey>('maxVorticity');

  const selectedRuns = selected
    .map((id) => runs.find((r) => r.metadata.id === id))
    .filter((r): r is ExperimentRun => !!r);

  if (runs.length === 0) {
    return <p className="section-sub">ჯერ არ არის შენახული ექსპერიმენტი — გაუშვით და შეინახეთ ერთი მაინც „ექსპერიმენტების“ ჩანართში.</p>;
  }

  const series: ChartSeries[] = selectedRuns.map((run, i) => ({
    label: run.metadata.name,
    color: COMPARE_COLORS[i % COMPARE_COLORS.length],
    points: run.samples.map((s) => ({ x: s.t, y: s[metric] })),
  }));

  return (
    <div>
      <p className="section-sub" style={{ marginBottom: 12 }}>
        აირჩიეთ 2-დან 4 ექსპერიმენტამდე შესადარებლად.
      </p>
      <div className="compare-chip-row">
        {runs.map((r, i) => {
          const idx = selected.indexOf(r.metadata.id);
          const active = idx !== -1;
          return (
            <button
              key={r.metadata.id}
              className="compare-chip"
              style={{
                borderColor: active ? COMPARE_COLORS[idx % COMPARE_COLORS.length] : undefined,
                background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onClick={() => toggle(r.metadata.id)}
            >
              {r.metadata.name}
            </button>
          );
        })}
      </div>

      {selectedRuns.length > 0 && (
        <div className="compare-param-diff">
          {selectedRuns.map((run, i) => (
            <div className="compare-param-card" key={run.metadata.id} style={{ borderColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}>
              <div className="compare-param-card-title">
                <span className="mono" style={{ color: COMPARE_COLORS[i % COMPARE_COLORS.length] }}>
                  {String.fromCharCode(65 + i)}
                </span>{' '}
                {run.metadata.name}
              </div>
              {PARAM_LABELS.map((p) => (
                <div className="compare-param-card-row" key={p.key}>
                  <span>{p.label}</span>
                  <span className="mono">{Number(run.metadata.params[p.key]).toFixed(3)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="sampling-field" style={{ marginBottom: 14 }}>
        <label>შედარების სიდიდე</label>
        <select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)}>
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {series.length > 0 ? (
        <ResearchChart series={series} xLabel="დრო t" yLabel={METRICS.find((m) => m.key === metric)?.label ?? metric} />
      ) : (
        <p className="section-sub">აირჩიეთ ექსპერიმენტები ზემოთ.</p>
      )}
    </div>
  );
}
