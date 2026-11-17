import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  DEFAULT_PARAMS,
  SEED_CLOUD_HALF_HEIGHT,
  SEED_CLOUD_RADIUS,
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
} from '../simulation/particleShader';

const tmpColor = new THREE.Color();
/** These sprites carry no per-particle sharpness attribute, so they all use the soft kernel. */
const SOFT_KERNEL_WEIGHT = spriteKernelWeight(0);
/** Only 2600 tracers here, so each one may carry more light than in the 14k-tracer laboratory. */
const SPARSE_SCENE_MAX_GAIN = 2.6;

/**
 * Small, self-contained decorative vortex for the hero panel. It runs its
 * own local looping clock (0 -> ~0.94 -> 0) using the exact same closed-form
 * model as the main laboratory, but is completely independent of the global
 * simulation store so scrolling past it never disturbs the real simulation.
 */
function HeroVortexInner() {
  const seeds = useMemo(() => seedParticles(2600), []);

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

  const tRef = useRef(0);

  useFrame((state, delta) => {
    tRef.current += Math.min(delta, 0.05) * 0.045;
    if (tRef.current > 0.94) tRef.current = 0;
    const params = DEFAULT_PARAMS;
    const field = computeSharedField(tRef.current, params);
    const zScale = visualScaleZ(field.scaleZ);
    syncParticleMaterialScale(material, state.gl.domElement.height);

    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = geometry.getAttribute('aSize') as THREE.BufferAttribute;

    let lightSum = 0;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const r = seed.r0 * field.scaleR;
      const z = seed.z0 * zScale;
      const h = hShape(seed.rho0);
      const theta = seed.theta0 + h * field.kOmega;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      positions.setXYZ(i, x, z, y);

      const angularVelocity = field.omega * h;
      const normalized = compressForColor(Math.abs(angularVelocity), ANGULAR_COLOR_REF);
      equalizeForAdditive(angularSpeedToColor(normalized, tmpColor)).multiplyScalar(seed.intensity);
      colors.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      const size = (0.7 + seed.seedJitter * 0.6) * seed.sizeMul * (0.75 + 0.35 * normalized) * 6.5;
      sizes.setX(i, size);
      lightSum += additiveLuminance(tmpColor) * size * size * SOFT_KERNEL_WEIGHT;
    }
    // Same additive light budget as the laboratory scene (see additiveExposure).
    const exposure = additiveExposure(
      lightSum,
      SEED_CLOUD_RADIUS * field.scaleR,
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

export function HeroVortexBackground() {
  return (
    <Canvas
      camera={{ position: [4.4, 2.1, 4.4], fov: 48 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#020305', 4, 11]} />
      <ambientLight intensity={0.22} />
      <HeroVortexInner />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}
