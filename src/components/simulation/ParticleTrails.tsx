import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../hooks/useSimStore';
import { computeSharedField, CRITICAL_TIME, hShape, netRadialCoefficient, visualScaleZ } from '../../utils/flowField';
import { colorForMapping, type ColorMapping } from '../../utils/colorScale';

/**
 * Trajectory / streamline view.
 *
 * Because every particle's position is a CLOSED FORM function of t (see
 * flowField.ts), a trail is just that same function sampled at several past
 * times — there is no per-frame history buffer to maintain. Each frame we
 * compute the shared field state (one shared quadrature, not per-particle)
 * at K past times, then map a fixed subset of particles through each of
 * those K shared states. This is why trails stay correct even after
 * scrubbing the timeline arbitrarily.
 *
 * A small fraction of the subset are "signature filaments": they carry a
 * much longer sample span so their spiral winding stays visible across a
 * wide stretch of the vortex, revealing the helical geometry even while
 * playback is paused. The rest are shorter, denser near the core (small
 * rho0) and fainter/thinner further out — read via opacity, since WebGL
 * line width is not reliably controllable across platforms.
 */

const MAX_TRAIL_PARTICLES = 420;
const SIGNATURE_FRACTION = 0.08;
const tmpColor = new THREE.Color();

/**
 * Sample times between tStart and tEnd, spaced uniformly in sqrt(T - tau)
 * rather than in tau. The swirl rate grows like 1/sqrt(T - tau), so this
 * spacing gives every trail segment (nearly) the same turning angle — the
 * trail stays a smooth spiral right up to T instead of degenerating into a
 * few long straight chords where the rotation is fastest.
 */
function trailSampleTime(tStart: number, tEnd: number, frac: number): number {
  const uStart = Math.sqrt(Math.max(CRITICAL_TIME - tStart, 0));
  const uEnd = Math.sqrt(Math.max(CRITICAL_TIME - tEnd, 0));
  const u = uStart + (uEnd - uStart) * frac;
  return CRITICAL_TIME - u * u;
}

interface ParticleTrailsProps {
  colorBy?: ColorMapping;
  /** 'full' (default): dense trails for the trajectories mode. 'signature': a sparse, always-long-span set used as a permanent hint of the helical structure inside the particles mode. */
  variant?: 'full' | 'signature';
}

const SIGNATURE_ONLY_COUNT = 40;

export function ParticleTrails({ colorBy, variant = 'full' }: ParticleTrailsProps) {
  const seeds = useSimStore((s) => s.seeds);
  const quality = useSimStore((s) => s.quality);

  const subsetCount =
    variant === 'signature'
      ? Math.min(seeds.length, SIGNATURE_ONLY_COUNT)
      : Math.min(seeds.length, quality === 'low' ? 160 : quality === 'medium' ? 280 : MAX_TRAIL_PARTICLES);
  const subset = useMemo(() => {
    const stride = Math.max(1, Math.floor(seeds.length / subsetCount));
    const arr: number[] = [];
    for (let i = 0; i < seeds.length && arr.length < subsetCount; i += stride) arr.push(i);
    return arr;
  }, [seeds, subsetCount]);

  const isSignature = useMemo(
    () => (variant === 'signature' ? subset.map(() => true) : subset.map((_, i) => i % Math.round(1 / SIGNATURE_FRACTION) === 0)),
    [subset, variant],
  );

  const samplesPerTrail = useMemo(() => {
    const raw = Math.round(useSimStore.getState().params.trailLength / 1.7);
    return Math.min(72, Math.max(16, raw));
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const segCount = subset.length * (samplesPerTrail - 1);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(segCount * 2 * 3), 3));
    return geo;
  }, [subset, samplesPerTrail]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  const fieldCache = useMemo(
    () => new Array(samplesPerTrail).fill(null) as ReturnType<typeof computeSharedField>[],
    [samplesPerTrail],
  );
  const baseFieldCache = useMemo(
    () => new Array(samplesPerTrail).fill(null) as ReturnType<typeof computeSharedField>[],
    [samplesPerTrail],
  );

  useFrame(() => {
    const s = useSimStore.getState();
    const { t, params } = s;
    const activeColorMode: ColorMapping = colorBy ?? s.colorMode;
    const baseSpan = Math.min(t, 0.34 + params.trailLength / 220);
    const signatureSpan = Math.min(t, baseSpan * 3.1);

    // Sample the shared field at both time grids (base + signature) once per frame — not per particle.
    const signatureStart = Math.max(0, t - signatureSpan);
    const baseStart = Math.max(0, t - baseSpan);
    for (let k = 0; k < samplesPerTrail; k++) {
      const frac = k / (samplesPerTrail - 1);
      fieldCache[k] = computeSharedField(trailSampleTime(signatureStart, t, frac), params);
      baseFieldCache[k] = computeSharedField(trailSampleTime(baseStart, t, frac), params);
    }

    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const netC = netRadialCoefficient(t, params);

    let vertex = 0;
    for (let pi = 0; pi < subset.length; pi++) {
      const seed = seeds[subset[pi]];
      const sig = isSignature[pi];
      const cache = sig ? fieldCache : baseFieldCache;
      // Radial position (rho0) controls both brightness and effective thinness: inner filaments read denser/brighter, outer ones fainter.
      const radialWeight = Math.exp(-(seed.rho0 * seed.rho0) / 3.2);
      const variantDim = variant === 'signature' ? 0.5 : 1;
      const baseOpacity = (sig ? 0.9 : 0.5) * (0.35 + 0.65 * radialWeight) * variantDim;

      let prevX = 0;
      let prevY = 0;
      let prevZ = 0;
      for (let k = 0; k < samplesPerTrail; k++) {
        const field = cache[k];
        const r = seed.r0 * field.scaleR;
        const z = seed.z0 * visualScaleZ(field.scaleZ);
        const h = hShape(seed.rho0);
        const theta = seed.theta0 + h * field.kOmega;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        if (k > 0) {
          const age = k / samplesPerTrail;
          const angularVelocity = field.omega * h;
          const vR = -netC * r;
          const vZ = 2 * netC * z;
          const vTheta = angularVelocity * r;
          const speed = Math.sqrt(vR * vR + vZ * vZ + vTheta * vTheta);
          const vorticity = (2 * field.omega / Math.max(field.rCore, 1e-4)) * Math.exp(-seed.rho0 * seed.rho0);
          colorForMapping(activeColorMode, { angularVelocity, vorticity, speed, z }, tmpColor);
          const fade = baseOpacity * (0.12 + 0.88 * age);

          positions.setXYZ(vertex, prevX, prevZ, prevY);
          colors.setXYZ(vertex, tmpColor.r * fade, tmpColor.g * fade, tmpColor.b * fade);
          vertex++;
          positions.setXYZ(vertex, x, z, y);
          colors.setXYZ(vertex, tmpColor.r * fade, tmpColor.g * fade, tmpColor.b * fade);
          vertex++;
        }
        prevX = x;
        prevY = y;
        prevZ = z;
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
