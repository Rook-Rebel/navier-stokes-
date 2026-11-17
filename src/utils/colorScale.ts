import { Color } from 'three';
import { RATE_K_SWIRL } from './flowField';

/**
 * Restrained scientific palette: dark teal (calm / slow) through blue-teal
 * and warm amber to a pale warm white (extreme concentration). Nothing in
 * the app should read as "colorful for its own sake" — a hot color must
 * always correspond to a genuinely large physical quantity at that point.
 */
const GRADIENT_STOPS = [
  { at: 0.0, color: new Color('#0d3a3a') }, // dark teal — calm / outer vortex
  { at: 0.4, color: new Color('#2f8fae') }, // blue-teal — moderate
  { at: 0.72, color: new Color('#d99a3e') }, // warm amber — high
  { at: 1.0, color: new Color('#fdf3df') }, // pale warm white — extreme concentration
];

/** Soft white used for trajectories/streamlines and the "single color" mapping. */
export const TRAJECTORY_WHITE = new Color('#eef2f5');
/** Muted orange used for calm scientific warnings (never a bright alarm color). */
export const WARNING_MUTED = new Color('#c98a4a');

/**
 * Samples the 4-stop scientific gradient at a normalized value in [0, 1].
 * Used everywhere a physical quantity (angular speed, vorticity, velocity
 * modulus, height) is mapped to color, so every "hot" pixel in the app
 * means the same thing: a large value on the same restrained scale.
 */
export function sampleGradient(normalized: number, out = new Color()): Color {
  const n = Math.min(Math.max(normalized, 0), 1);
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (n >= a.at && n <= b.at) {
      const localT = (n - a.at) / (b.at - a.at || 1);
      out.copy(a.color).lerp(b.color, localT);
      return out;
    }
  }
  out.copy(GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color);
  return out;
}

/** Back-compat name used by a few older call sites; identical to sampleGradient. */
export const angularSpeedToColor = sampleGradient;

/**
 * Maps a non-negative physical quantity onto the [0, 1] gradient coordinate
 * with a LOGARITHMIC scale.
 *
 * Why logarithmic: every quantity colored here grows like a power of
 * 1 / (T - t). Between t = 0 and the regularized end of the run the angular
 * speed alone rises twentyfold. A linear or exponentially-saturating scale
 * can show either the calm start or the violent end, never both — near T it
 * paints every particle the same "maximum" color and the radial structure of
 * the core disappears. On a log scale equal color steps mean equal RATIOS, so
 * the fast core stays distinguishable from its slower surroundings at every t.
 *
 * `refScale` is the quantity's characteristic value; the scale has its knee
 * at COLOR_KNEE_FRACTION * refScale and reaches the top of the gradient at
 * COLOR_DYNAMIC_RANGE times that knee. The mapping is absolute (it never
 * depends on t or on the current maximum), so a given color always means the
 * same physical value.
 */
const COLOR_KNEE_FRACTION = 0.266;
const COLOR_DYNAMIC_RANGE = 28;
const COLOR_LOG_SPAN = Math.log(1 + COLOR_DYNAMIC_RANGE);

export function compressForColor(value: number, refScale: number): number {
  const knee = Math.max(refScale * COLOR_KNEE_FRACTION, 1e-6);
  return Math.min(1, Math.log(1 + Math.abs(value) / knee) / COLOR_LOG_SPAN);
}

/** Relative luminance of a (linear) color — how much light it adds under additive blending. */
export function additiveLuminance(color: Color): number {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

/**
 * The top of the gradient (pale warm white) carries ~4x the luminance of its
 * blue-teal middle. Left alone, a region that turns "hot" would therefore
 * also turn four times brighter and clip under additive blending — brightness
 * would be double-counting what the hue already says. This pulls hot colors
 * part of the way back toward the mid-tone luminance: they stay the brightest
 * colors on the scale, just not overwhelmingly so. Hue is untouched.
 */
const EQUAL_LUMINANCE_PIVOT = 0.25;
const EQUAL_LUMINANCE_STRENGTH = 0.6;

export function equalizeForAdditive(color: Color): Color {
  const luminance = additiveLuminance(color);
  if (luminance > EQUAL_LUMINANCE_PIVOT) {
    color.multiplyScalar(Math.pow(EQUAL_LUMINANCE_PIVOT / luminance, EQUAL_LUMINANCE_STRENGTH));
  }
  return color;
}

/**
 * Reference angular-speed scale used everywhere a particle is colored by
 * rotation speed (main scene, hero background, comparison panels). Tuned so
 * an early, calm t reads mostly dark teal and only the fastest
 * near-singularity particles read pale/hot.
 *
 * All three references are expressed as multiples of the model's swirl
 * constant, so retuning RATE_K_SWIRL in flowField.ts rescales the colors
 * with it instead of silently saturating (or blacking out) the gradient.
 */
export const ANGULAR_COLOR_REF = 1.88 * RATE_K_SWIRL;
export const VORTICITY_COLOR_REF = 2.24 * RATE_K_SWIRL;
export const SPEED_COLOR_REF = 0.88 * RATE_K_SWIRL;
/** One "visual unit" of speed: divide a speed by this before using it for sprite stretch, size or arrow length. */
export const VISUAL_SPEED_UNIT = RATE_K_SWIRL / 0.85;
/** Characteristic half-height used to normalize the "height" color mapping. */
export const HEIGHT_COLOR_REF = 2.2;

export type ColorMapping = 'angular' | 'vorticity' | 'speed' | 'height' | 'uniform';

export interface ColorMappingSample {
  angularVelocity: number;
  vorticity: number;
  speed: number;
  z: number;
}

/**
 * Single shared function mapping a particle/trail sample's physical
 * quantities to a color under the currently-selected "ფერი ასახავს" mode.
 * Kept in one place so the 3D scene and the legend can never drift apart.
 */
export function colorForMapping(mode: ColorMapping, sample: ColorMappingSample, out = new Color()): Color {
  if (mode === 'uniform') {
    return out.copy(TRAJECTORY_WHITE);
  }
  let normalized: number;
  if (mode === 'vorticity') {
    normalized = compressForColor(sample.vorticity, VORTICITY_COLOR_REF);
  } else if (mode === 'speed') {
    normalized = compressForColor(sample.speed, SPEED_COLOR_REF);
  } else if (mode === 'height') {
    normalized = Math.min(Math.max((sample.z + HEIGHT_COLOR_REF) / (2 * HEIGHT_COLOR_REF), 0), 1);
  } else {
    normalized = compressForColor(sample.angularVelocity, ANGULAR_COLOR_REF);
  }
  return sampleGradient(normalized, out);
}

export const COLOR_MAPPING_LABELS: Record<ColorMapping, string> = {
  angular: 'კუთხურ სიჩქარეს',
  vorticity: 'ვორტიციტეტს',
  speed: 'სიჩქარის მოდულს',
  height: 'სიმაღლეს',
  uniform: 'ერთიან ფერს',
};

/** Legend stop labels shown under the color bar for each mapping. */
export const COLOR_MAPPING_LEGEND: Record<ColorMapping, [string, string, string]> = {
  angular: ['ნელი კუთხური ბრუნვა', 'საშუალო ბრუნვა', 'სწრაფი კუთხური ბრუნვა'],
  vorticity: ['დაბალი ვორტიციტეტი', 'საშუალო ვორტიციტეტი', 'მაღალი ვორტიციტეტი'],
  speed: ['დაბალი სიჩქარე', 'საშუალო სიჩქარე', 'მაღალი სიჩქარე'],
  height: ['ქვედა არე (z < 0)', 'ცენტრალური სიბრტყე', 'ზედა არე (z > 0)'],
  uniform: ['ერთიანი ფერი', '', ''],
};
