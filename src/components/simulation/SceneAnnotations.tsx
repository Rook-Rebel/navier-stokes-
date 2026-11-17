import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useSimStore } from '../../hooks/useSimStore';
import { computeSharedField, visualScaleZ } from '../../utils/flowField';

interface AnnotationState {
  key: string;
  text: string;
  x: number;
  y: number;
  z: number;
}

/**
 * "ანოტაციები": a handful of small labels tracking meaningful spatial
 * regions of the current field state (the shrinking core edge, the
 * stretched top of the structure, the concentrated center). Recomputed from
 * the same shared field used everywhere else — no arbitrary placement.
 */
export function SceneAnnotations() {
  const [labels, setLabels] = useState<AnnotationState[]>([]);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current += 1;
    if (frameCount.current % 6 !== 0) return; // throttle DOM updates to ~10Hz
    const { t, params } = useSimStore.getState();
    const field = computeSharedField(t, params);
    const zTop = 1.5 * visualScaleZ(field.scaleZ);
    const next: AnnotationState[] = [
      { key: 'compression', text: 'რადიალური შეკუმშვა →', x: field.rCore, y: 0, z: 0 },
      { key: 'stretch', text: 'ღერძული გაწელვა ↑', x: 0.1, y: zTop * 0.94, z: 0 },
    ];
    if (t > 0.55) {
      next.push({ key: 'vorticity', text: 'მაღალი ვორტიციტეტი', x: field.rCore * 0.4, y: 0, z: field.rCore * 0.4 });
    }
    if (t > 0.75) {
      next.push({ key: 'concentration', text: 'კონცენტრაციის რეგიონი', x: 0, y: 0, z: field.rCore * 0.7 });
    }
    setLabels(next);
  });

  return (
    <>
      {labels.map((l) => (
        <Html key={l.key} position={[l.x, l.y, l.z]} center distanceFactor={9} occlude={false}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: '#cfe3ee',
              background: 'rgba(6,10,16,0.55)',
              border: '1px solid rgba(148,178,214,0.25)',
              borderRadius: 999,
              padding: '3px 9px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {l.text}
          </span>
        </Html>
      ))}
    </>
  );
}
