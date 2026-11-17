import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore, type VectorDensity } from '../../hooks/useSimStore';
import { evaluateEulerianField } from '../../utils/flowField';
import { colorForMapping, VISUAL_SPEED_UNIT } from '../../utils/colorScale';

interface GridPoint {
  r: number;
  theta: number;
  z: number;
}

const DENSITY_SETTINGS: Record<VectorDensity, { radii: number[]; angles: number; zLevels: number[] }> = {
  low: { radii: [0.35, 1.1, 1.85], angles: 6, zLevels: [-1.2, 0, 1.2] },
  medium: { radii: [0.25, 0.6, 1.0, 1.45, 1.9], angles: 10, zLevels: [-1.2, -0.6, 0, 0.6, 1.2] },
  high: { radii: [0.2, 0.5, 0.8, 1.1, 1.45, 1.8, 2.1], angles: 14, zLevels: [-1.4, -0.9, -0.4, 0, 0.4, 0.9, 1.4] },
};

function buildGrid(density: VectorDensity): GridPoint[] {
  const { radii, angles, zLevels } = DENSITY_SETTINGS[density];
  const pts: GridPoint[] = [];
  for (const r of radii) {
    for (let a = 0; a < angles; a++) {
      const theta = (a / angles) * Math.PI * 2 + r * 0.4;
      for (const z of zLevels) {
        pts.push({ r, theta, z });
      }
    }
  }
  return pts;
}

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const tmpDir = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

/**
 * "სიჩქარის ველი" mode: samples the Eulerian velocity field u(r,theta,z,t)
 * (see evaluateEulerianField in flowField.ts) on a fixed spatial grid — not
 * following particle trajectories — and draws each sample as an oriented
 * arrow glyph. "რეალური მასშტაბი" scales arrow length by actual speed
 * (clamped, so a handful of near-singular samples can't dominate the whole
 * grid); "ნორმალიზებული ვექტორები" fixes every arrow to the same length so
 * direction stays legible everywhere and magnitude is read from color alone.
 */
export function VelocityVectors() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const density = useSimStore((s) => s.vectorDensity);
  const grid = useMemo(() => buildGrid(density), [density]);

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.04, 1, 8);
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: false, toneMapped: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = useSimStore.getState();
    const { t, params, colorMode, vectorScaleMode } = s;

    for (let i = 0; i < grid.length; i++) {
      const { r, theta, z } = grid[i];
      const sample = evaluateEulerianField(r, theta, z, t, params);
      tmpDir.set(sample.vx, sample.vy, sample.vz);
      const dir = sample.speed > 1e-5 ? tmpDir.normalize() : upVector;

      const x = r * Math.cos(theta);
      const yPos = z;
      const zPos = r * Math.sin(theta);

      dummy.position.set(x, yPos, zPos);
      dummy.quaternion.setFromUnitVectors(upVector, dir);
      const length =
        vectorScaleMode === 'normalized' ? 0.34 : 0.12 + Math.min(sample.speed / VISUAL_SPEED_UNIT, 2.2) * 0.28;
      dummy.scale.set(1, length, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorForMapping(colorMode, { angularVelocity: sample.angularVelocity, vorticity: sample.vorticityZ, speed: sample.speed, z }, tmpColor);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh key={density} ref={meshRef} args={[geometry, material, grid.length]} frustumCulled={false} />
  );
}
