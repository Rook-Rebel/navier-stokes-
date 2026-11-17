import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useProbeStore, PROBE_COLORS } from '../../hooks/useProbeStore';

/**
 * An invisible, always camera-facing plane through the origin, used only
 * while probe-placement is armed: clicking it converts the 2D click into a
 * 3D world point (the standard "click to place a point" trick for an
 * orbit-camera scene) which becomes a fixed field probe location.
 */
function ProbePlacementPlane() {
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (planeRef.current) planeRef.current.quaternion.copy(camera.quaternion);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const { addProbe, probes } = useProbeStore.getState();
    if (probes.length >= 5) return;
    addProbe(e.point.x, e.point.y, e.point.z);
  };

  return (
    <mesh ref={planeRef} onClick={handleClick}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ProbeMarkers() {
  const probes = useProbeStore((s) => s.probes);
  return (
    <>
      {probes.map((p, i) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={PROBE_COLORS[i % PROBE_COLORS.length]} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** Mounted inside the research-mode 3D scene: renders probe markers always, and the placement plane only while armed. */
export function FieldProbeLayer() {
  const placing = useProbeStore((s) => s.placing);
  return (
    <>
      <ProbeMarkers />
      {placing && <ProbePlacementPlane />}
    </>
  );
}
