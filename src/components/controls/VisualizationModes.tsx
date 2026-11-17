import { useSimStore, type VisualizationMode } from '../../hooks/useSimStore';

const MODES: { id: VisualizationMode; label: string }[] = [
  { id: 'particles', label: 'ნაწილაკები' },
  { id: 'trajectories', label: 'ტრაექტორიები' },
  { id: 'velocity', label: 'სიჩქარის ველი' },
  { id: 'vorticity', label: 'ვორტიციტეტი' },
  { id: 'energy', label: 'ენერგია' },
  { id: 'comparison', label: 'შედარება' },
];

export function VisualizationModes() {
  const mode = useSimStore((s) => s.mode);
  const setMode = useSimStore((s) => s.setMode);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>ვიზუალიზაციის რეჟიმი</span>
      </div>
      <div className="mode-tabs" role="tablist" aria-label="ვიზუალიზაციის რეჟიმის არჩევა">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`mode-tab${mode === m.id ? ' active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
