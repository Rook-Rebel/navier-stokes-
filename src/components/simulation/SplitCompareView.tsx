import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleSystem } from './ParticleSystem';

const EARLY_T = 0.2;
const LATE_T = 0.985;
/** Both halves share camera orientation, scale and particle count — only t differs. */
const SHARED_CAMERA: [number, number, number] = [4.6, 2.6, 4.6];

/**
 * "შედარება" visualization mode: the same live parameters, rendered as two
 * frozen snapshots of the model side by side — an early, smooth state and a
 * state close to the singularity — so a slider change is visible on both
 * halves at once without needing to scrub the timeline back and forth. A
 * draggable divider lets the viewer directly compare regions of the frame.
 */
export function SplitCompareView() {
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerDown = () => {
    dragging.current = true;
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.min(Math.max(pct, 12), 88));
  };

  return (
    <div
      ref={containerRef}
      className="split-compare"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="split-compare-pane" style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}>
        <div className="glass-panel split-compare-label" style={{ left: 12 }}>
          გლუვი რეჟიმი (t ≈ {EARLY_T.toFixed(2)})
        </div>
        <Canvas camera={{ position: SHARED_CAMERA, fov: 46 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
          <color attach="background" args={['#020305']} />
          <ambientLight intensity={0.4} />
          <ParticleSystem colorBy="angular" interactive={false} overrideT={EARLY_T} baseSize={7} />
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.35} />
        </Canvas>
      </div>

      <div className="split-compare-pane" style={{ clipPath: `inset(0 0 0 ${splitPct}%)` }}>
        <div className="glass-panel split-compare-label" style={{ right: 12 }}>
          სინგულარობასთან ახლოს (t ≈ {LATE_T.toFixed(3)})
        </div>
        <Canvas camera={{ position: SHARED_CAMERA, fov: 46 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
          <color attach="background" args={['#020305']} />
          <ambientLight intensity={0.4} />
          <ParticleSystem colorBy="angular" interactive={false} overrideT={LATE_T} baseSize={7} />
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.35} />
        </Canvas>
      </div>

      <div className="split-compare-handle" style={{ left: `${splitPct}%` }} onPointerDown={onPointerDown}>
        <span />
      </div>
    </div>
  );
}
