import { useMemo } from 'react';
import { useSimStore } from '../../hooks/useSimStore';
import { useProbeStore, PROBE_COLORS, MAX_PROBES } from '../../hooks/useProbeStore';
import { evaluateEulerianField, MAX_SIM_TIME } from '../../utils/flowField';
import { ResearchChart } from './ResearchChart';

function toCylindrical(x: number, y: number, z: number) {
  const r = Math.sqrt(x * x + z * z);
  const theta = Math.atan2(z, x);
  return { r, theta, zCyl: y };
}

/** "ველის ზონდი" — click anywhere in the 3D scene (while armed) to drop a fixed spatial probe and read the real Eulerian field there, live and over time. */
export function FieldProbePanel() {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const placing = useProbeStore((s) => s.placing);
  const togglePlacing = useProbeStore((s) => s.togglePlacing);
  const probes = useProbeStore((s) => s.probes);
  const removeProbe = useProbeStore((s) => s.removeProbe);
  const clearProbes = useProbeStore((s) => s.clearProbes);

  const readouts = probes.map((p) => {
    const { r, theta, zCyl } = toCylindrical(p.x, p.y, p.z);
    const field = evaluateEulerianField(r, theta, zCyl, t, params);
    return { probe: p, r, theta, zCyl, field };
  });

  const timeSeries = useMemo(() => {
    const N = 80;
    return probes.map((p, i) => {
      const { r, theta, zCyl } = toCylindrical(p.x, p.y, p.z);
      const points = Array.from({ length: N }, (_, k) => {
        const sampleT = (MAX_SIM_TIME * k) / (N - 1);
        return { x: sampleT, y: evaluateEulerianField(r, theta, zCyl, sampleT, params).speed };
      });
      return { label: `ზონდი ${i + 1}`, color: PROBE_COLORS[i % PROBE_COLORS.length], points };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probes, params]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm${placing ? ' active' : ''}`} onClick={togglePlacing}>
          {placing ? 'ზონდის დაფიქსირება (დააწკაპუნეთ სცენაზე)' : 'ველის ზონდი'}
        </button>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
          {probes.length}/{MAX_PROBES} ზონდი
        </span>
        {probes.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearProbes}>
            ყველას გასუფთავება
          </button>
        )}
      </div>

      {probes.length === 0 ? (
        <p className="section-sub">
          დააჭირეთ „ველის ზონდი“-ს, შემდეგ დააწკაპუნეთ 3D სცენის ნებისმიერ წერტილზე — მაქსიმუმ {MAX_PROBES} ზონდის დაფიქსირება შეგიძლიათ.
        </p>
      ) : (
        <div className="probe-list" style={{ marginBottom: 20 }}>
          {readouts.map(({ probe, r, theta, zCyl, field }, i) => (
            <div className="probe-card" key={probe.id}>
              <div className="probe-card-head">
                <span>
                  <span className="probe-swatch" style={{ background: PROBE_COLORS[i % PROBE_COLORS.length] }} />
                  ზონდი {i + 1}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => removeProbe(probe.id)}>
                  წაშლა
                </button>
              </div>
              <div className="floating-data-row">
                <span>x, y, z</span>
                <b className="mono">
                  {probe.x.toFixed(2)}, {probe.y.toFixed(2)}, {probe.z.toFixed(2)}
                </b>
              </div>
              <div className="floating-data-row">
                <span>r, θ</span>
                <b className="mono">
                  {r.toFixed(2)}, {theta.toFixed(2)}
                </b>
              </div>
              <div className="floating-data-row">
                <span>u_x, u_y, u_z</span>
                <b className="mono">
                  {field.vx.toFixed(3)}, {field.vy.toFixed(3)}, {field.vz.toFixed(3)}
                </b>
              </div>
              <div className="floating-data-row">
                <span>|u|</span>
                <b className="mono">{field.speed.toFixed(3)}</b>
              </div>
              <div className="floating-data-row">
                <span>ვორტიციტეტის პროქსი</span>
                <b className="mono">{field.vorticityZ.toFixed(3)}</b>
              </div>
              <div className="floating-data-row">
                <span>ლოკალური კუთხური სიჩქარე</span>
                <b className="mono">{field.angularVelocity.toFixed(3)}</b>
              </div>
              <div className="floating-data-row">
                <span>შეკუმშვის ინდიკატორი</span>
                <b className="mono">{field.compressionIndicator.toFixed(3)}</b>
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem', marginTop: 2 }}>
                {zCyl.toFixed(2)} = ღერძული კოორდინატი
              </div>
            </div>
          ))}
        </div>
      )}

      {probes.length > 0 && (
        <>
          <div className="side-panel-title" style={{ marginBottom: 8 }}>
            <span>|u|(t) თითოეულ ზონდზე</span>
          </div>
          <ResearchChart series={timeSeries} xLabel="დრო t" yLabel="|u|" cursorX={t} />
        </>
      )}
    </div>
  );
}
