import { useSimStore } from '../../hooks/useSimStore';
import { computeSharedField, evaluateParticle } from '../../utils/flowField';

function ParticleInspectorLive({ index, isSelected }: { index: number; isSelected: boolean }) {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const seed = useSimStore((s) => s.seeds[index]);
  const selectParticle = useSimStore((s) => s.selectParticle);

  if (!seed) return null;
  const field = computeSharedField(t, params);
  const kin = evaluateParticle(seed, field, params);
  const thetaNorm = ((kin.theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  return (
    <div className="glass-panel floating-data-panel particle-inspector">
      <div className="side-panel-title" style={{ marginBottom: 6 }}>
        <span>{isSelected ? 'არჩეული ნაწილაკის ტრაექტორია' : 'ნაწილაკის მონაცემები'}</span>
      </div>
      <div className="floating-data-row">
        <span>r (რადიუსი)</span>
        <b>{kin.r.toFixed(3)}</b>
      </div>
      <div className="floating-data-row">
        <span>θ (კუთხე)</span>
        <b>{thetaNorm.toFixed(3)}</b>
      </div>
      <div className="floating-data-row">
        <span>z (ღერძული კოორდინატი)</span>
        <b>{kin.z.toFixed(3)}</b>
      </div>
      <div className="floating-data-row">
        <span>ლოკალური სიჩქარე</span>
        <b>{kin.speed.toFixed(3)}</b>
      </div>
      <div className="floating-data-row">
        <span>კუთხური სიჩქარე</span>
        <b>{kin.angularVelocity.toFixed(3)}</b>
      </div>
      <div className="floating-data-row">
        <span>ვორტიციტეტის პროქსი</span>
        <b>{kin.vorticityZ.toFixed(3)}</b>
      </div>
      {isSelected && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 10 }}
          onClick={() => selectParticle(null)}
        >
          თვალთვალის შეწყვეტა
        </button>
      )}
    </div>
  );
}

export function ParticleInspector() {
  const hovered = useSimStore((s) => s.hoveredParticleIndex);
  const selectedIndex = useSimStore((s) => s.selectedParticle?.index ?? null);
  const activeIndex = selectedIndex ?? hovered;
  if (activeIndex == null) return null;
  return <ParticleInspectorLive index={activeIndex} isSelected={selectedIndex != null} />;
}
