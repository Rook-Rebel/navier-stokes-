import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../hooks/useSimStore';
import { computeSharedField, visualScaleZ } from '../../utils/flowField';
import { colorForMapping, VISUAL_SPEED_UNIT } from '../../utils/colorScale';

/**
 * "ვორტიციტეტი" mode's signature visual: instead of only recoloring dots,
 * each sampled grid point draws a tiny curved hook tangent to the local
 * rotation — a schematic glyph for "fluid is curling here", not a literal
 * streamline. Brightness and how much of the hook is drawn both scale with
 * the local vorticity magnitude, so a glance at the density/brightness of
 * hooks shows where rotational structure is concentrated. Built once as a
 * single dynamic LineSegments buffer (same technique as ParticleTrails), so
 * it costs one draw call regardless of grid resolution.
 */

interface GridPoint {
  r: number;
  theta: number;
  z: number;
}

function buildGrid(): GridPoint[] {
  const pts: GridPoint[] = [];
  const radii = [0.3, 0.7, 1.1, 1.5, 1.9];
  const angles = 12;
  const zLevels = [-1.4, -0.7, 0, 0.7, 1.4];
  for (const r of radii) {
    for (let a = 0; a < angles; a++) {
      const theta = (a / angles) * Math.PI * 2 + r * 0.35;
      for (const z of zLevels) pts.push({ r, theta, z });
    }
  }
  return pts;
}

const GRID = buildGrid();
const ARC_SEGMENTS = 8;
const ARC_SPAN = Math.PI * 0.6;
const ARC_RADIUS = 0.15;
const tmpColor = new THREE.Color();

/** Unit arc in local (tangent, radial) coordinates, centered on the tangential direction. */
const UNIT_ARC: [number, number][] = Array.from({ length: ARC_SEGMENTS + 1 }, (_, i) => {
  const a = -ARC_SPAN / 2 + (i / ARC_SEGMENTS) * ARC_SPAN;
  return [Math.cos(a), Math.sin(a)];
});

export function VorticityGlyphs() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const segCount = GRID.length * ARC_SEGMENTS;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3));
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const s = useSimStore.getState();
    const { t, params } = s;
    const field = computeSharedField(t, params);
    const zScale = visualScaleZ(field.scaleZ);

    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;

    let vertex = 0;
    for (let i = 0; i < GRID.length; i++) {
      const { r, theta, z } = GRID[i];
      const rho = r / field.rCore;
      const vorticity = (2 * field.omega / Math.max(field.rCore, 1e-4)) * Math.exp(-rho * rho);
      const reveal = Math.min(vorticity / (1.4 * VISUAL_SPEED_UNIT), 1); // how much of the arc is drawn
      const revealSegments = Math.max(1, Math.round(reveal * ARC_SEGMENTS));

      colorForMapping('vorticity', { angularVelocity: 0, vorticity, speed: 0, z }, tmpColor);
      const brightness = 0.35 + 0.65 * reveal;

      const tanX = -Math.sin(theta);
      const tanZ = Math.cos(theta);
      const radX = Math.cos(theta);
      const radZ = Math.sin(theta);
      const cx = r * Math.cos(theta);
      const cz = r * Math.sin(theta);
      const cy = z * zScale * 0.999; // matches particle z-scaling closely enough for a schematic glyph

      for (let seg = 0; seg < ARC_SEGMENTS; seg++) {
        const drawn = seg < revealSegments;
        const [u0x, u0y] = UNIT_ARC[seg];
        const [u1x, u1y] = UNIT_ARC[seg + 1];
        const x0 = cx + (tanX * u0x + radX * u0y) * ARC_RADIUS;
        const z0 = cz + (tanZ * u0x + radZ * u0y) * ARC_RADIUS;
        const x1 = cx + (tanX * u1x + radX * u1y) * ARC_RADIUS;
        const z1 = cz + (tanZ * u1x + radZ * u1y) * ARC_RADIUS;

        const alpha = drawn ? brightness : 0;
        positions.setXYZ(vertex, x0, cy, z0);
        colors.setXYZ(vertex, tmpColor.r * alpha, tmpColor.g * alpha, tmpColor.b * alpha);
        vertex++;
        positions.setXYZ(vertex, x1, cy, z1);
        colors.setXYZ(vertex, tmpColor.r * alpha, tmpColor.g * alpha, tmpColor.b * alpha);
        vertex++;
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
