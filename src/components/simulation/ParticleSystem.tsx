import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useSimStore } from '../../hooks/useSimStore';
import {
  SEED_CLOUD_HALF_HEIGHT,
  SEED_CLOUD_RADIUS,
  computeSharedField,
  hShape,
  netRadialCoefficient,
  visualScaleZ,
} from '../../utils/flowField';
import {
  additiveLuminance,
  colorForMapping,
  equalizeForAdditive,
  VISUAL_SPEED_UNIT,
  type ColorMapping,
} from '../../utils/colorScale';
import {
  additiveExposure,
  createParticleMaterial,
  spriteKernelWeight,
  syncParticleMaterialScale,
} from './particleShader';

interface ParticleSystemProps {
  /** Fixed color-mapping override for decorative/mini scenes; omit to follow the live global "ფერი ასახავს" setting. */
  colorBy?: ColorMapping;
  interactive?: boolean;
  baseSize?: number;
  /** When set, renders a frozen snapshot at this t instead of the live global time (used by the split-screen comparison mode). */
  overrideT?: number;
}

const tmpColor = new THREE.Color();
const tmpVelWorld = new THREE.Vector3();
const tmpWhite = new THREE.Color('#ffffff');
const tmpDampTarget = new THREE.Color('#1c3a3a');

/** Per-particle sharpness is a function only of rho0 and the tracer class (fixed seed properties), so it is written once at geometry build time, never in the per-frame loop. */
function sharpnessFromRho0(rho0: number, sizeMul = 1): number {
  // Large tracers (arm sheets, haze) are the soft volumetric glow; only the fine tracers are drawn crisp.
  const crisp = Math.min(Math.max(1.9 - sizeMul, 0), 1);
  return Math.exp(-(rho0 * rho0) / 2.0) * crisp;
}

export function ParticleSystem({ colorBy, interactive = true, baseSize = 7.5, overrideT }: ParticleSystemProps) {
  const seeds = useSimStore((s) => s.seeds);
  const quality = useSimStore((s) => s.quality);
  const pointsRef = useRef<THREE.Points>(null);
  const { raycaster } = useThree();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = seeds.length;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute('aStretch', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    geo.setAttribute('aVorticityBoost', new THREE.BufferAttribute(new Float32Array(n), 1));

    const sharpness = new Float32Array(n);
    for (let i = 0; i < n; i++) sharpness[i] = sharpnessFromRho0(seeds[i].rho0, seeds[i].sizeMul);
    geo.setAttribute('aSharpness', new THREE.BufferAttribute(sharpness, 1));

    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 12);
    return geo;
  }, [seeds]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => createParticleMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);

  /** How much light each sprite's Gaussian kernel integrates to — fixed per particle, used by the exposure estimate. */
  const kernelWeights = useMemo(() => {
    const weights = new Float32Array(seeds.length);
    for (let i = 0; i < seeds.length; i++) weights[i] = spriteKernelWeight(sharpnessFromRho0(seeds[i].rho0, seeds[i].sizeMul));
    return weights;
  }, [seeds]);

  useEffect(() => {
    raycaster.params.Points = { threshold: 0.06 };
  }, [raycaster]);

  const qualitySizeMul = quality === 'low' ? 0.72 : quality === 'medium' ? 0.88 : 1;
  const overdrawMul = Math.min(1, Math.max(0.42, 9000 / seeds.length));

  useFrame((state) => {
    const s = useSimStore.getState();
    const { params, highlightedTerm, hoveredParticleIndex, selectedParticle } = s;
    const activeColorMode: ColorMapping = colorBy ?? s.colorMode;
    const t = overrideT ?? s.t;
    const field = computeSharedField(t, params);
    const netC = netRadialCoefficient(t, params);
    const zScale = visualScaleZ(field.scaleZ);
    // Rate at which the DRAWN height is changing: d(zScale)/dt = zScale'(scaleZ) * scaleZ * 2 C_r. Streaks follow
    // the motion the viewer actually sees, so once the soft clamp on the drawn height saturates they stop pointing
    // up the axis and wrap around the column with the rotation.
    const dLn = 1e-3;
    const zScaleRate = ((visualScaleZ(field.scaleZ * (1 + dLn)) - zScale) / dLn) * 2 * netC;

    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizesAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const stretchAttr = geometry.getAttribute('aStretch') as THREE.BufferAttribute;
    const vortBoostAttr = geometry.getAttribute('aVorticityBoost') as THREE.BufferAttribute;

    const clock = state.clock.getElapsedTime();
    const viewMatrix = state.camera.matrixWorldInverse;
    syncParticleMaterialScale(material, state.gl.domElement.height);

    // Per-frame global modifiers driven by which equation term is hovered.
    let colorTintTarget: THREE.Color | null = null;
    let tintAmount = 0;
    let sizePulse = 1;
    let normalizedDamp = 1;
    if (highlightedTerm === 'viscosity') {
      normalizedDamp = 0.35;
    } else if (highlightedTerm === 'advection') {
      sizePulse = 1.35;
    } else if (highlightedTerm === 'forcing') {
      sizePulse = 1 + 0.35 * Math.sin(clock * 9);
    } else if (highlightedTerm === 'pressure') {
      colorTintTarget = new THREE.Color('#eaf6ff');
      tintAmount = 0.28;
    } else if (highlightedTerm === 'divfree') {
      colorTintTarget = new THREE.Color('#35d7a0');
      tintAmount = 0.18 + 0.06 * Math.sin(clock * 2);
    } else if (highlightedTerm === 'dt') {
      sizePulse = 1.15;
    }

    const highlightParticle = (index: number | null, whiten: number, grow: number) => {
      if (index === null || index < 0 || index >= seeds.length) return;
      tmpColor.fromBufferAttribute(colors, index);
      const peak = Math.max(tmpColor.r, tmpColor.g, tmpColor.b, 1e-4);
      tmpColor.multiplyScalar(0.85 / peak).lerp(tmpWhite, whiten);
      colors.setXYZ(index, tmpColor.r, tmpColor.g, tmpColor.b);
      sizesAttr.setX(index, sizesAttr.getX(index) * grow);
    };

    let lightSum = 0;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const r = seed.r0 * field.scaleR;
      const z = seed.z0 * zScale;
      const h = hShape(seed.rho0);
      const theta = seed.theta0 + h * field.kOmega;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const x = r * cosT;
      const y = r * sinT;
      positions.setXYZ(i, x, z, y);

      const angularVelocity = field.omega * h;
      const vR = -netC * r;
      const vTheta = angularVelocity * r;
      // True model velocity (used for color): the axial component uses the exact, un-clamped height z0 * scaleZ.
      const vZ = 2 * netC * seed.z0 * field.scaleZ;
      const speed = Math.sqrt(vR * vR + vZ * vZ + vTheta * vTheta);
      const vorticity = (2 * field.omega / Math.max(field.rCore, 1e-4)) * Math.exp(-seed.rho0 * seed.rho0);

      const normalizedVort = Math.min(vorticity / (2.2 * VISUAL_SPEED_UNIT), 1);
      vortBoostAttr.setX(i, normalizedVort);

      colorForMapping(activeColorMode, { angularVelocity, vorticity, speed, z }, tmpColor);
      if (normalizedDamp !== 1) tmpColor.lerp(tmpDampTarget, 1 - normalizedDamp);
      if (colorTintTarget) tmpColor.lerp(colorTintTarget, tintAmount);
      equalizeForAdditive(tmpColor).multiplyScalar(seed.intensity);
      colors.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      const luminance = additiveLuminance(tmpColor);

      // Apparent (on-screen) velocity in three.js axes — x = r cos, y = drawn height, z = r sin — projected into view
      // space so the sprite elongates along the motion the viewer sees.
      tmpVelWorld.set(vR * cosT - vTheta * sinT, seed.z0 * zScaleRate, vR * sinT + vTheta * cosT);
      const visualSpeed = tmpVelWorld.length() / VISUAL_SPEED_UNIT;
      tmpVelWorld.transformDirection(viewMatrix);
      const elongation = Math.min(visualSpeed * 0.55, 2.0);
      stretchAttr.setXY(i, tmpVelWorld.x * elongation, tmpVelWorld.y * elongation);

      const jitter = 0.7 + seed.seedJitter * 0.6;
      const normalizedForSize = Math.min(visualSpeed / 0.8, 1);
      const size =
        baseSize * jitter * seed.sizeMul * (0.72 + 0.28 * normalizedForSize) * qualitySizeMul * overdrawMul * sizePulse;
      sizesAttr.setX(i, size);

      // Light this sprite deposits: luminance x footprint. The footprint grows with the streak's on-screen length
      // gain g while its brightness falls as g^-0.7 (see the vertex shader), leaving a net g^0.3.
      const lengthGain = 1 + Math.min(Math.hypot(tmpVelWorld.x, tmpVelWorld.y) * elongation, 2) * 0.6;
      lightSum +=
        luminance * (1 + 0.25 * normalizedVort) * size * size * Math.pow(lengthGain, 0.3) * kernelWeights[i];
    }

    // Additive blending sums overlapping sprites, so the frame's brightness is budgeted as a whole: estimate the mean
    // luminance about to land inside the cloud's silhouette and scale every color toward a fixed target. This is what
    // keeps the squeezed, fast, "hot" column near T a structured filament bundle instead of a flat white bar — and it
    // adapts by itself to the particle count, the color mapping, the sliders and the viewing direction.
    const exposure = additiveExposure(
      lightSum,
      SEED_CLOUD_RADIUS * field.scaleR,
      SEED_CLOUD_HALF_HEIGHT * zScale,
      state.camera,
    );
    const colorArray = colors.array as Float32Array;
    for (let k = 0; k < colorArray.length; k++) colorArray[k] *= exposure;

    // The hovered / selected tracer is a UI highlight, not part of the light budget: redraw it at full strength.
    highlightParticle(hoveredParticleIndex, 0.3, 1.8);
    highlightParticle(selectedParticle?.index ?? null, 0.55, 2.4);

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizesAttr.needsUpdate = true;
    stretchAttr.needsUpdate = true;
    vortBoostAttr.needsUpdate = true;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    if (typeof e.index === 'number') {
      useSimStore.getState().setHoveredParticle(e.index);
    }
  };
  const handlePointerOut = () => {
    if (!interactive) return;
    useSimStore.getState().setHoveredParticle(null);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    if (typeof e.index === 'number') {
      useSimStore.getState().selectParticle(e.index);
    }
  };

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerOut={interactive ? handlePointerOut : undefined}
      onClick={interactive ? handleClick : undefined}
      frustumCulled={false}
    />
  );
}
