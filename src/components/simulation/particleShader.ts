import * as THREE from 'three';

/**
 * Custom point-sprite shader with a small anisotropic-billboard trick:
 *
 * Each particle carries `aStretch` — a 2D vector whose DIRECTION is the
 * particle's local velocity projected into view space, and whose LENGTH
 * encodes speed (capped). The fragment shader rotates gl_PointCoord into a
 * frame aligned with that direction and draws an ellipse whose long axis
 * follows the motion — a cheap, GPU-only stand-in for both "directional
 * elongation" and a soft motion-blur impression, without any blur pass.
 * The streak keeps its width, gains length, and loses brightness as it
 * lengthens, so fast regions read as streaks rather than as brighter blobs.
 *
 * `aSharpness` (0 = soft/outer, 1 = sharp/core) is written ONCE per particle
 * at geometry build time (it depends only on the particle's fixed rho0, not
 * on time), so the per-frame loop never has to touch it. It tightens the
 * Gaussian falloff so outer particles read as soft haze while the
 * concentrated core reads as fine, crisp points.
 *
 * `aVorticityBoost` (0..1) brightens the base color for particles currently
 * sitting in a high-vorticity region, independent of whatever color mapping
 * is active — a universal "this is where the action is" cue.
 *
 * `uSizeScale` / `uMaxSize` are set from the drawing-buffer height every
 * frame (see syncParticleMaterialScale) so a sprite covers the same fraction
 * of the viewport on a 1x laptop panel, a 2x phone and a 4K export alike.
 */
/** Gaussian falloff exponents of the sprite kernel: soft outer haze vs. crisp core points. */
const KERNEL_SOFT = 2.6;
const KERNEL_SHARP = 7.5;

export const particleVertexShader = /* glsl */ `
  uniform float uSizeScale;
  uniform float uMaxSize;

  attribute float aSize;
  attribute vec2 aStretch;
  attribute float aSharpness;
  attribute float aVorticityBoost;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vDir;
  varying float vGain;
  varying float vSharpness;

  void main() {
    float elong = length(aStretch);
    vDir = elong > 1e-5 ? aStretch / elong : vec2(1.0, 0.0);
    // Length gain of the streak: 1 = round sprite, up to 2.2x longer along the on-screen motion.
    vGain = 1.0 + min(elong, 2.0) * 0.6;
    vSharpness = aSharpness;
    // A streak spreads the same light over a longer footprint (like a real exposure), so it is dimmed as it
    // lengthens instead of adding brightness for free.
    vColor = color * (1.0 + aVorticityBoost * 0.25) / pow(vGain, 0.7);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mvPosition.z, 0.001);
    float rawSize = aSize * vGain * (uSizeScale / dist);
    // Clamp so a very close camera (e.g. the "inside the vortex" preset) never turns particles into one overlapping blob.
    gl_PointSize = clamp(rawSize, 1.0, uMaxSize);

    // Far particles dim, particles about to hit the lens fade out, and sub-pixel sprites fade instead of flickering.
    vAlpha = clamp(1.4 - dist / 14.0, 0.15, 1.0) * smoothstep(0.12, 0.8, dist) * clamp(rawSize / (1.5 * vGain), 0.35, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vDir;
  varying float vGain;
  varying float vSharpness;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // gl_PointCoord has y pointing DOWN, view space has y pointing up.
    vec2 dir = vec2(vDir.x, -vDir.y);
    vec2 perp = vec2(-dir.y, dir.x);
    // The quad was enlarged by vGain; squeezing the ACROSS axis by the same factor keeps the streak's width
    // constant while its length grows, and keeps the whole ellipse inside the quad (no clipped square ends).
    float along = dot(uv, dir);
    float across = dot(uv, perp) * vGain;
    float q = length(vec2(along, across)) * 2.0;
    if (q > 1.0) discard;
    float falloff = exp(-q * q * mix(${KERNEL_SOFT.toFixed(2)}, ${KERNEL_SHARP.toFixed(2)}, vSharpness));
    float edge = 1.0 - smoothstep(0.75, 1.0, q);
    float alpha = falloff * edge * vAlpha;
    if (alpha <= 0.003) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/** Legacy calibration: sprite sizes were tuned on an 800-device-pixel-high canvas. */
const REFERENCE_BUFFER_HEIGHT = 800;
const BASE_SIZE_SCALE = 11;
const BASE_MAX_SIZE = 30;

export function createParticleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    uniforms: {
      uSizeScale: { value: BASE_SIZE_SCALE },
      uMaxSize: { value: BASE_MAX_SIZE },
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Call once per frame with the canvas's drawing-buffer height (gl.domElement.height) to keep sprites resolution-independent. */
export function syncParticleMaterialScale(material: THREE.ShaderMaterial, bufferHeight: number) {
  const k = Math.max(bufferHeight, 1) / REFERENCE_BUFFER_HEIGHT;
  material.uniforms.uSizeScale.value = BASE_SIZE_SCALE * k;
  material.uniforms.uMaxSize.value = BASE_MAX_SIZE * k;
}

/**
 * ---- Additive light budget -------------------------------------------------
 *
 * Sprites are blended additively, so wherever many of them overlap the pixel
 * simply clips to white and all structure is lost. Rather than hand-tuning a
 * dimming curve per scene, every particle layer estimates the mean luminance
 * it is about to deposit per pixel inside the cloud's silhouette, and scales
 * its colors so that estimate stays near a fixed target.
 *
 * The estimate is geometric, not empirical: a sprite of size `aSize` has world
 * radius aSize * (BASE_SIZE_SCALE / REFERENCE_BUFFER_HEIGHT) * tan(fov / 2)
 * (the camera distance and the canvas resolution both cancel), and a Gaussian
 * kernel exp(-k q^2) integrates to pi R^2 (1 - e^-k) / k.
 */

/** Integral of the sprite kernel relative to a flat disc of the same radius. */
export function spriteKernelWeight(sharpness: number): number {
  const k = KERNEL_SOFT + (KERNEL_SHARP - KERNEL_SOFT) * Math.min(Math.max(sharpness, 0), 1);
  return (1 - Math.exp(-k)) / k;
}

/** Mean per-pixel luminance the particle layer aims for inside the cloud silhouette. */
const TARGET_MEAN_LUMINANCE = 0.15;
/** < 1 so a denser / hotter state still ends up somewhat brighter instead of being flattened to the same grey. */
const EXPOSURE_RESPONSE = 0.72;
const EXPOSURE_MIN = 0.02;
const EXPOSURE_MAX = 1.6;

const tmpViewDir = new THREE.Vector3();

/**
 * @param lightSum   sum over particles of luminance * aSize^2 * lengthGain^0.3 * kernelWeight (see ParticleSystem)
 * @param cloudRadius      current radius of the particle cloud (world units)
 * @param cloudHalfHeight  current half-height of the particle cloud along the vortex axis (three.js y)
 * @param camera     the camera looking at it — the silhouette of a tall thin column is tiny seen from above
 * @param maxGain    upper limit of the multiplier; sparse scenes (few tracers) may raise it to stay readable
 * @returns a multiplier for every particle color
 */
export function additiveExposure(
  lightSum: number,
  cloudRadius: number,
  cloudHalfHeight: number,
  camera: THREE.Camera,
  maxGain = EXPOSURE_MAX,
): number {
  const fov = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? (camera as THREE.PerspectiveCamera).fov : 50;
  const tanHalfFov = Math.tan((fov * Math.PI) / 360);
  const worldRadiusPerSize = (BASE_SIZE_SCALE / REFERENCE_BUFFER_HEIGHT) * tanHalfFov;

  camera.getWorldDirection(tmpViewDir);
  const axial = Math.min(Math.abs(tmpViewDir.y), 1);
  const side = Math.sqrt(1 - axial * axial);
  // Projected area of a cylinder: its end cap seen along the axis plus its rectangular side seen across it.
  const silhouette = Math.PI * cloudRadius * cloudRadius * axial + 4 * cloudRadius * cloudHalfHeight * side;

  const meanLuminance = (Math.PI * worldRadiusPerSize * worldRadiusPerSize * lightSum) / Math.max(silhouette, 1e-6);
  if (!(meanLuminance > 0)) return maxGain;
  const exposure = Math.pow(TARGET_MEAN_LUMINANCE / meanLuminance, EXPOSURE_RESPONSE);
  return Math.min(maxGain, Math.max(EXPOSURE_MIN, exposure));
}
