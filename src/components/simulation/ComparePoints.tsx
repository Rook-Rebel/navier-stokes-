import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  DEFAULT_PARAMS,
  SEED_CLOUD_HALF_HEIGHT,
  SEED_CLOUD_RADIUS,
  computeDecayingSharedField,
  computeSharedField,
  hShape,
  seedParticles,
  visualScaleZ,
} from '../../utils/flowField';
import {
  ANGULAR_COLOR_REF,
  additiveLuminance,
  angularSpeedToColor,
  compressForColor,
  equalizeForAdditive,
} from '../../utils/colorScale';
import {
  additiveExposure,
  createParticleMaterial,
  spriteKernelWeight,
  syncParticleMaterialScale,
} from './particleShader';

const tmpColor = new THREE.Color();
/** These sprites carry no per-particle sharpness attribute, so they all use the soft kernel. */
const SOFT_KERNEL_WEIGHT = spriteKernelWeight(0);
/** A small panel with a couple of thousand tracers needs more light per tracer than the 14k-tracer laboratory. */
const SPARSE_SCENE_MAX_GAIN = 3;

interface ComparePointsProps {
  variant: 'decaying' | 'singular';
  t: number;
  viscosity?: number;
  count?: number;
}

/** Non-interactive particle cloud used by the side-by-side "expected vs. new construction" and "normal vs. singular" comparison panels. */
export function ComparePoints({ variant, t, viscosity = 0.32, count = 2200 }: ComparePointsProps) {
  const seeds = useMemo(() => seedParticles(count), [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = seeds.length;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 14);
    return geo;
  }, [seeds]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => createParticleMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = geometry.getAttribute('aSize') as THREE.BufferAttribute;
    syncParticleMaterialScale(material, state.gl.domElement.height);

    // The shared field depends only on t, never on the particle — evaluate it once per frame, not once per particle.
    const singularField = variant === 'singular' ? computeSharedField(t, DEFAULT_PARAMS) : null;
    const decayingField = variant === 'decaying' ? computeDecayingSharedField(t, viscosity) : null;
    const scaleR = singularField ? singularField.scaleR : decayingField!.scaleR;
    const zScale = singularField ? visualScaleZ(singularField.scaleZ) : 1;
    const kOmega = singularField ? singularField.kOmega : decayingField!.kOmega;
    const omega = singularField ? singularField.omega : decayingField!.omega;
    let lightSum = 0;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const h = hShape(seed.rho0);
      const r = seed.r0 * scaleR;
      const z = seed.z0 * zScale;
      const theta = seed.theta0 + h * kOmega;
      const angularVelocity = omega * h;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      positions.setXYZ(i, x, z, y);

      const normalized = compressForColor(Math.abs(angularVelocity), ANGULAR_COLOR_REF);
      equalizeForAdditive(angularSpeedToColor(normalized, tmpColor)).multiplyScalar(seed.intensity);
      colors.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      const size = (0.7 + seed.seedJitter * 0.6) * seed.sizeMul * (0.75 + 0.35 * normalized) * 8;
      sizes.setX(i, size);
      lightSum += additiveLuminance(tmpColor) * size * size * SOFT_KERNEL_WEIGHT;
    }
    // Same additive light budget as the laboratory scene (see additiveExposure).
    const exposure = additiveExposure(
      lightSum,
      SEED_CLOUD_RADIUS * scaleR,
      SEED_CLOUD_HALF_HEIGHT * zScale,
      state.camera,
      SPARSE_SCENE_MAX_GAIN,
    );
    const colorArray = colors.array as Float32Array;
    for (let k = 0; k < colorArray.length; k++) colorArray[k] *= exposure;
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
