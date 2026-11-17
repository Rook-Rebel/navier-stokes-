import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ComparePoints } from '../simulation/ComparePoints';
import { LazyMount } from '../common/LazyMount';
import { MAX_SIM_TIME } from '../../utils/flowField';

export function NormalVsSingularSection() {
  const [t, setT] = useState(0.25);
  const [playing, setPlaying] = useState(false);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastRef.current = null;
      return;
    }
    let raf: number;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt * 0.09;
        return next >= MAX_SIM_TIME ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <section className="section" id="normal-vs-singular">
      <span className="eyebrow-label">გვერდიგვერდ დაკვირვება</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        ჩვეულებრივი დინება vs. სინგულარობასთან მიმავალი რეჟიმი
      </h2>
      <p className="section-sub">
        ორივე სცენას ერთი და იგივე დროის კონტროლი მართავს — განსხვავება მხოლოდ იმ მათემატიკურ მექანიზმშია, რომელიც სიჩქარის ველს დროში ცვლის.
      </p>

      <LazyMount minHeight={360}>
        <div className="comparison-grid" style={{ marginTop: 20 }}>
          <div className="comparison-col">
            <div className="comparison-col-title">ჩვეულებრივი გლუვი დინება</div>
            <div className="comparison-col-viz">
              <Canvas camera={{ position: [4.2, 2, 4.2], fov: 46 }} dpr={[1, 1.5]}>
                <color attach="background" args={['#03050a']} />
                <ambientLight intensity={0.5} />
                <ComparePoints variant="decaying" t={t} />
              </Canvas>
            </div>
          </div>
          <div className="comparison-col">
            <div className="comparison-col-title">სინგულარობასთან მიმავალი რეჟიმი</div>
            <div className="comparison-col-viz">
              <Canvas camera={{ position: [4.2, 2, 4.2], fov: 46 }} dpr={[1, 1.5]}>
                <color attach="background" args={['#03050a']} />
                <ambientLight intensity={0.5} />
                <ComparePoints variant="singular" t={t} />
              </Canvas>
            </div>
          </div>
        </div>
      </LazyMount>

      <div className="glass-panel" style={{ padding: '14px 20px', marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setPlaying((v) => !v)}>
          {playing ? 'პაუზა' : 'გაშვება'}
        </button>
        <div className="param-slider" style={{ marginBottom: 0, flex: 1 }}>
          <input
            type="range"
            min={0}
            max={MAX_SIM_TIME}
            step={0.001}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            aria-label="საერთო დროის კონტროლი"
            style={{ ['--pct' as string]: `${(t / MAX_SIM_TIME) * 100}%` }}
          />
        </div>
        <span className="mono" style={{ color: 'var(--text-accent)', minWidth: 70, textAlign: 'right' }}>
          t = {t.toFixed(3)}
        </span>
      </div>
    </section>
  );
}
