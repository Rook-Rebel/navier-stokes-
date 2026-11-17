import { useSimStore } from '../../hooks/useSimStore';
import { COLOR_MAPPING_LABELS, type ColorMapping } from '../../utils/colorScale';

const ORDER: ColorMapping[] = ['angular', 'vorticity', 'speed', 'height', 'uniform'];

export function ColorModeSelector() {
  const colorMode = useSimStore((s) => s.colorMode);
  const setColorMode = useSimStore((s) => s.setColorMode);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>ფერი ასახავს</span>
      </div>
      <div className="mode-tabs">
        {ORDER.map((m) => (
          <button
            key={m}
            className={`mode-tab${colorMode === m ? ' active' : ''}`}
            onClick={() => setColorMode(m)}
          >
            {COLOR_MAPPING_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
