import { useSimStore, type VectorDensity, type VectorScaleMode } from '../../hooks/useSimStore';

const LEVELS: { id: VectorDensity; label: string }[] = [
  { id: 'low', label: 'დაბალი' },
  { id: 'medium', label: 'საშუალო' },
  { id: 'high', label: 'მაღალი' },
];

const SCALE_MODES: { id: VectorScaleMode; label: string }[] = [
  { id: 'real', label: 'რეალური მასშტაბი' },
  { id: 'normalized', label: 'ნორმალიზებული ვექტორები' },
];

/** "ვექტორების სიმჭიდროვე" და მასშტაბირება — only relevant while the velocity-field mode is active. */
export function VectorDensityControl() {
  const density = useSimStore((s) => s.vectorDensity);
  const setVectorDensity = useSimStore((s) => s.setVectorDensity);
  const scaleMode = useSimStore((s) => s.vectorScaleMode);
  const setVectorScaleMode = useSimStore((s) => s.setVectorScaleMode);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>ვექტორების სიმჭიდროვე</span>
      </div>
      <div className="quality-row">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={`btn btn-sm${density === l.id ? ' active' : ''}`}
            onClick={() => setVectorDensity(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="quality-row" style={{ marginTop: 8 }}>
        {SCALE_MODES.map((m) => (
          <button
            key={m.id}
            className={`btn btn-sm${scaleMode === m.id ? ' active' : ''}`}
            onClick={() => setVectorScaleMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
