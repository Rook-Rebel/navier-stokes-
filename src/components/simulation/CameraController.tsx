import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useSimStore, type CameraPreset } from '../../hooks/useSimStore';
import { computeSharedField, evaluateParticle, visualScaleZ } from '../../utils/flowField';

const PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  full: { pos: [5.2, 3.4, 5.2], target: [0, 0, 0] },
  top: { pos: [0.01, 7.6, 0.01], target: [0, 0, 0] },
  side: { pos: [7.4, 0.2, 0.01], target: [0, 0, 0] },
  core: { pos: [1.6, 0.9, 1.6], target: [0, 0, 0] },
  trajectory: { pos: [3.4, 1.6, -4.4], target: [0, 0, 0] },
  inside: { pos: [0.55, 0.3, 0.7], target: [0, 0.15, 0] },
};

/** Slow, deliberate azimuthal drift rate for "ავტომატური კამერა" (radians/sec) — a full orbit takes a couple of minutes. */
const AUTO_ORBIT_RATE = 0.045;

export function CameraController() {
  const controlsRef = useRef<CameraControls>(null);
  const userInteracting = useRef(false);

  useEffect(() => {
    const unsub = useSimStore.subscribe((state, prevState) => {
      if (state.cameraPresetRequest && state.cameraPresetRequest !== prevState.cameraPresetRequest) {
        const p = PRESETS[state.cameraPresetRequest.preset];
        controlsRef.current?.setLookAt(...p.pos, ...p.target, true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const p = PRESETS.full;
    controlsRef.current?.setLookAt(...p.pos, ...p.target, false);
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      userInteracting.current = true;
    };
    const onEnd = () => {
      userInteracting.current = false;
    };
    controls.addEventListener('controlstart', onStart);
    controls.addEventListener('controlend', onEnd);
    return () => {
      controls.removeEventListener('controlstart', onStart);
      controls.removeEventListener('controlend', onEnd);
    };
  }, []);

  useFrame((_, delta) => {
    const { selectedParticle, seeds, t, params, autoCamera } = useSimStore.getState();
    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedParticle) {
      const seed = seeds[selectedParticle.index];
      if (seed) {
        const field = computeSharedField(t, params);
        const kin = evaluateParticle(seed, field, params);
        const zScale = visualScaleZ(field.scaleZ) / Math.max(field.scaleZ, 1e-6);
        controls.setTarget(kin.x, kin.z * zScale, kin.y, true);
      }
    } else if (autoCamera && !userInteracting.current) {
      // A slow, calm orbit whose distance breathes gently with the simulation stage — never jarring, never fast.
      controls.rotate(AUTO_ORBIT_RATE * delta, 0, false);
      const targetDistance = 6.4 - t * 3.4;
      const currentDistance = controls.distance;
      const diff = targetDistance - currentDistance;
      if (Math.abs(diff) > 0.05) {
        controls.dolly(diff * delta * 0.4, false);
      }
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={0.35}
      maxDistance={22}
      dollySpeed={0.5}
      smoothTime={0.7}
      draggingSmoothTime={0.12}
    />
  );
}
