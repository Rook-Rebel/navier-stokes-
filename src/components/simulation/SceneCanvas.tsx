import { ReactNode, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { NavierStokesScene } from './NavierStokesScene';
import { useSimStore } from '../../hooks/useSimStore';
import { LoadingScreen } from '../common/LoadingScreen';
import { WebGLFallback } from '../common/WebGLFallback';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface SceneCanvasProps {
  children?: ReactNode;
  compact?: boolean;
  forcedMode?: 'particles' | 'trajectories' | 'velocity' | 'vorticity' | 'energy';
  interactive?: boolean;
  ariaLabel?: string;
}

export function SceneCanvas({ children, compact, forcedMode, interactive = true, ariaLabel }: SceneCanvasProps) {
  const [ready, setReady] = useState(false);
  const quality = useSimStore((s) => s.quality);
  const webglOk = useMemo(detectWebGL, []);

  if (!webglOk) {
    return <WebGLFallback />;
  }

  const dpr = quality === 'low' ? [1, 1.2] : quality === 'medium' ? [1, 1.6] : [1, 2];

  return (
    <div style={{ position: 'absolute', inset: 0 }} role="img" aria-label={ariaLabel ?? 'ნავიე-სტოქსის ვორტექსის 3D ვიზუალიზაცია'}>
      {!ready && <LoadingScreen />}
      <Canvas
        dpr={dpr as [number, number]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        camera={{ fov: 45, position: [5.2, 3.4, 5.2], near: 0.05, far: 100 }}
        onCreated={() => setReady(true)}
      >
        <NavierStokesScene compact={compact} forcedMode={forcedMode} interactive={interactive} />
        {quality !== 'low' && !compact && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.28} luminanceThreshold={0.58} luminanceSmoothing={0.2} mipmapBlur radius={0.28} />
          </EffectComposer>
        )}
      </Canvas>
      {children}
    </div>
  );
}
