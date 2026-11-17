import { Suspense } from 'react';
import { Grid, Line } from '@react-three/drei';
import { useSimStore } from '../../hooks/useSimStore';
import { ParticleSystem } from './ParticleSystem';
import { ParticleTrails } from './ParticleTrails';
import { VelocityVectors } from './VelocityVectors';
import { VorticityGlyphs } from './VorticityGlyphs';
import { CameraController } from './CameraController';
import { SimulationClock } from './SimulationClock';
import { SceneAnnotations } from './SceneAnnotations';

function AxisAndGrid() {
  return (
    <group>
      <Grid
        position={[0, -2.4, 0]}
        args={[16, 16]}
        cellColor="#0e1c2e"
        sectionColor="#16304c"
        cellSize={0.5}
        sectionSize={2.5}
        fadeDistance={16}
        fadeStrength={1.6}
        infiniteGrid
      />
      <Line points={[[0, -3.2, 0], [0, 3.2, 0]]} color="#233f5c" lineWidth={1} transparent opacity={0.45} />
    </group>
  );
}

interface NavierStokesSceneProps {
  /** Renders a lighter-weight scene for mini/comparison viewports. */
  compact?: boolean;
  forcedMode?: 'particles' | 'trajectories' | 'velocity' | 'vorticity' | 'energy';
  interactive?: boolean;
}

export function NavierStokesScene({ compact = false, forcedMode, interactive = true }: NavierStokesSceneProps) {
  const mode = useSimStore((s) => s.mode);
  const annotationsEnabled = useSimStore((s) => s.annotationsEnabled);
  const effectiveMode = forcedMode ?? mode;

  return (
    <>
      <color attach="background" args={['#020305']} />
      <fog attach="fog" args={['#020305', 9, 24]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={0.22} color="#5f9fc9" />
      {!compact && <AxisAndGrid />}
      <Suspense fallback={null}>
        {effectiveMode === 'particles' && (
          <>
            <ParticleSystem interactive={interactive} />
            {!compact && <ParticleTrails variant="signature" />}
          </>
        )}
        {effectiveMode === 'trajectories' && (
          <>
            <ParticleSystem interactive={interactive} baseSize={4.5} />
            <ParticleTrails variant="full" />
          </>
        )}
        {effectiveMode === 'velocity' && <VelocityVectors />}
        {effectiveMode === 'vorticity' && (
          <>
            <ParticleSystem interactive={interactive} baseSize={5.5} />
            {!compact && <VorticityGlyphs />}
          </>
        )}
        {effectiveMode === 'energy' && <ParticleSystem interactive={interactive} baseSize={9} />}
      </Suspense>
      {!compact && annotationsEnabled && <SceneAnnotations />}
      {!compact && <SimulationClock />}
      {!compact && <CameraController />}
    </>
  );
}
