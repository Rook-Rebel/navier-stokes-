import { useSimStore } from '../../hooks/useSimStore';
import { COLOR_MAPPING_LABELS, COLOR_MAPPING_LEGEND, TRAJECTORY_WHITE, sampleGradient } from '../../utils/colorScale';

const STOPS = [0.12, 0.55, 0.92];

/** Legend swatches always sample the SAME gradient function the 3D scene uses, and relabel themselves to whichever "ფერი ასახავს" mapping is currently active. */
export function Legend() {
  const colorMode = useSimStore((s) => s.colorMode);
  const isUniform = colorMode === 'uniform';
  const legendLabels = COLOR_MAPPING_LEGEND[colorMode];

  return (
    <div className="glass-panel legend-panel">
      <div className="side-panel-title" style={{ marginBottom: 8 }}>
        <span>ფერი ასახავს: {COLOR_MAPPING_LABELS[colorMode]}</span>
      </div>
      {isUniform ? (
        <div className="legend-row" style={{ marginBottom: 0 }}>
          <span className="legend-swatch" style={{ background: `#${TRAJECTORY_WHITE.getHexString()}` }} />
          <span>ერთიანი ფერი — არცერთი სიდიდე არ არის კოდირებული</span>
        </div>
      ) : (
        STOPS.map((stop, i) => (
          <div className="legend-row" style={{ marginBottom: i === STOPS.length - 1 ? 0 : 6 }} key={stop}>
            <span className="legend-swatch" style={{ background: `#${sampleGradient(stop).getHexString()}` }} />
            <span>{legendLabels[i]}</span>
          </div>
        ))
      )}
      <div className="legend-row" style={{ marginTop: 8, marginBottom: 0, opacity: 0.8 }}>
        <span className="legend-swatch" style={{ background: `#${TRAJECTORY_WHITE.getHexString()}` }} />
        <span>ნაწილაკის ტრაექტორია</span>
      </div>
    </div>
  );
}
