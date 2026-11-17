/**
 * flowField.ts — the toy mathematical model behind the visualization.
 *
 * WHAT THIS IS: an explicitly divergence-free, axisymmetric, time-dependent
 * velocity field in cylindrical coordinates (r, theta, z), integrated in
 * CLOSED FORM (no numerical ODE drift, no per-particle simulation error).
 * It is built by analogy with two classical exact solutions of the
 * Navier-Stokes equations:
 *
 *   1. The axisymmetric straining flow that underlies the BURGERS VORTEX
 *      (u_r = -c*r, u_z = 2c*z is divergence-free for any c(t)), which is
 *      the textbook mechanism for "vortex stretching": as a tube of fluid
 *      is compressed radially by a straining flow, it must stretch axially
 *      to conserve volume (r^2 * z = const along a trajectory).
 *   2. The Gaussian swirl profile of the Burgers/Lamb-Oseen vortex,
 *      u_theta(r) ~ (1/r) * (1 - exp(-r^2/core^2)), which stays finite at
 *      r = 0 and produces solid-body rotation near the core with a
 *      1/r-like falloff further out — realistic differential rotation.
 *
 * WHAT THIS IS NOT: this is *not* the construction from the September 2026
 * OpenAI finite-time blow-up result, and it does not attempt to reproduce
 * its self-similar profile, its forcing term, or its rate of blow-up. The
 * exponents below are chosen so the *qualitative* stages described in that
 * work — smooth rotation, inward spiraling, radial compression, axial
 * stretching, growing local velocity/vorticity — are visible and
 * controllable in real time. Every displayed number is computed directly
 * from these formulas (t and the current sliders); nothing is randomized.
 *
 * CLOSED-FORM DERIVATION
 * -----------------------
 * We superpose two divergence-free linear straining fields:
 *   field A (from the "radial compression" slider, rate c_r(t)):
 *       u_r = -c_r(t) r,      u_z = 2 c_r(t) z
 *   field B (from the "axial stretching" slider, rate c_z(t)):
 *       u_r = -(c_z(t)/2) r,  u_z = c_z(t) z
 * Both are individually divergence-free in cylindrical coordinates
 * ( (1/r) d(r u_r)/dr + du_z/dz = 0 ), so their sum is too. Writing the sum
 * as u_r = -C_r(t) r, u_z = C_z(t) z gives the identity C_z(t) = 2 C_r(t)
 * (volume conservation of a compressed & stretched tube).
 *
 * Because the radial/axial ODEs are linear with a time-varying coefficient,
 * they integrate exactly:
 *   r(t) = r0 * exp(-J_r(t)),   J_r(t) = integral_0^t C_r(tau) d tau
 *   z(t) = z0 * exp(+J_z(t)) = z0 * exp(+2 J_r(t))
 *
 * The swirl velocity is layered on independently (an azimuthal component
 * with no theta-dependence never contributes to divergence):
 *   u_theta(r,t) = Omega(t) * R_core(t) * g(rho) / rho,   rho = r / R_core(t)
 *   g(rho) = 1 - exp(-rho^2)
 * By construction R_core(t) shrinks with the same scale factor as r(t), so
 * rho0 = r0 / R_core(0) is CONSTANT along every trajectory (a self-similar
 * simplification). That makes the angular ODE integrable too:
 *   d theta/dt = u_theta / r = Omega(t) * h(rho0),  h(rho0) = g(rho0)/rho0^2
 *   theta(t) = theta0 + h(rho0) * K(t),   K(t) = integral_0^t Omega(tau) d tau
 *
 * J_r(t) and K(t) are single shared integrals (NOT one per particle), and
 * since every rate is a constant over a power of s(t) they are evaluated in
 * closed form: J_r(t) = A ln(T / s(t)), K(t) = 2 B (sqrt(T) - sqrt(s(t)))
 * plus a small forcing-pulse term (see "Exact time integrals" below). Every
 * particle then maps from its own (r0, theta0, z0, rho0) to its position at
 * time t in O(1). This is why thousands of particles can be animated at
 * full framerate while every trajectory still evolves individually
 * (differential rotation: inner particles wind far faster than outer ones).
 *
 * The vertical vorticity component omega_z = (1/r) d(r u_theta)/dr also has
 * a closed form: omega_z(t) = (2 Omega(t) / R_core(t)) * exp(-rho0^2).
 */

export const CRITICAL_TIME = 1;
// s(t) = T - t is clamped away from zero: this is what keeps every rate,
// and therefore every displayed number, finite. We never evaluate an
// actual infinity.
export const MIN_TIME_TO_SINGULARITY = 0.0025;
export const MAX_SIM_TIME = CRITICAL_TIME - MIN_TIME_TO_SINGULARITY; // 0.9975

export interface SimParams {
  /** viscosity nu — damps every growth rate; higher = smoother, slower approach. */
  viscosity: number;
  /** strength of the inward radial straining term. */
  radialCompression: number;
  /** strength of the axial stretching term (linked to radial compression by volume conservation). */
  axialStretch: number;
  /** baseline swirl / angular-velocity amplitude. */
  rotationIntensity: number;
  /** amplitude of a small forcing-like perturbation added to the swirl rate. */
  forcingInfluence: number;
  particleCount: number;
  trailLength: number;
  visualSpeed: number;
}

export const DEFAULT_PARAMS: SimParams = {
  viscosity: 0.32,
  radialCompression: 0.7,
  axialStretch: 0.6,
  rotationIntensity: 1.0,
  forcingInfluence: 0.25,
  particleCount: 14000,
  trailLength: 60,
  visualSpeed: 1,
};

export const PARAM_RANGES: Record<
  keyof Omit<SimParams, 'particleCount' | 'trailLength'>,
  { min: number; max: number; step: number }
> = {
  viscosity: { min: 0.02, max: 1.2, step: 0.01 },
  radialCompression: { min: 0.05, max: 1.6, step: 0.01 },
  axialStretch: { min: 0.05, max: 1.6, step: 0.01 },
  rotationIntensity: { min: 0.1, max: 3, step: 0.01 },
  forcingInfluence: { min: 0, max: 1, step: 0.01 },
  visualSpeed: { min: 0.1, max: 3, step: 0.01 },
};

/**
 * Model version tag shown in experiment metadata and reports. Bump this
 * whenever the formulas below (rate constants, core radius, shape
 * functions) change, so a saved experiment can record exactly which model
 * produced it.
 */
export const MODEL_VERSION = '1.2.0';

// Exported (not just module-private) so the in-app "model description" and
// generated research reports can quote the ACTUAL constants the simulation
// uses, instead of a hand-written number that could drift out of sync.
export const RATE_K_RADIAL = 0.32;
export const RATE_K_AXIAL = 0.3;
// Total core rotation over a whole run is K(T) ≈ 2·k_Ω·d(ν): with the old
// value 0.85 the core turned only ~70° in total, so no spiral could ever
// form. 6.0 gives ~1.3 turns at default settings (and ~4 at the slider max),
// which is what makes the differential winding actually visible.
export const RATE_K_SWIRL = 6.0;
export const R_CORE_0 = 1.35;
/** Visual-only cap on how far the axial stretch is allowed to push particles off-screen (see visualScaleZ). */
export const MAX_VISUAL_Z_STRETCH = 5.5;

/** Coefficient in the viscous-damping formula 1 / (1 + ν·k). Exported for the model-description page. */
export const VISCOUS_DAMPING_K = 1.15;

export function sOf(t: number): number {
  return Math.max(CRITICAL_TIME - t, MIN_TIME_TO_SINGULARITY);
}

export function viscousDamping(viscosity: number): number {
  return 1 / (1 + viscosity * VISCOUS_DAMPING_K);
}

/** c_r(t): instantaneous rate contributed by the radial-compression slider. */
function radialRate(t: number, p: SimParams): number {
  return (p.radialCompression * RATE_K_RADIAL * viscousDamping(p.viscosity)) / sOf(t);
}

/** c_z(t): instantaneous rate contributed by the axial-stretch slider. */
function axialRate(t: number, p: SimParams): number {
  return (p.axialStretch * RATE_K_AXIAL * viscousDamping(p.viscosity)) / sOf(t);
}

/** Combined net radial straining coefficient C_r(t) = c_r + c_z/2. */
export function netRadialCoefficient(t: number, p: SimParams): number {
  return radialRate(t, p) + axialRate(t, p) / 2;
}

/** Amplitude and frequency of the small forcing-like pulse riding on the swirl rate. */
export const FORCING_PULSE_AMPLITUDE = 0.22;
export const FORCING_PULSE_FREQUENCY = 26;

/** Swirl amplitude Omega(t), including a gentle forcing-driven pulse. */
export function swirlOmega(t: number, p: SimParams): number {
  const base = (p.rotationIntensity * RATE_K_SWIRL * viscousDamping(p.viscosity)) / Math.sqrt(sOf(t));
  const pulse = 1 + p.forcingInfluence * FORCING_PULSE_AMPLITUDE * Math.sin(t * FORCING_PULSE_FREQUENCY);
  return base * pulse;
}

// --- Exact time integrals -------------------------------------------------
// Every rate is (constant) / s(t)^n, so the integrals behind J_r(t) and K(t)
// have closed forms. They replace an earlier uniform trapezoid rule that put
// a few percent of error into J_r close to T, exactly where the integrand
// 1/s(t) is steepest. Beyond t = T - eps the clamp s = eps makes the
// integrand constant; those tail terms are included for completeness even
// though the app never steps past MAX_SIM_TIME.

const T_FLOOR = CRITICAL_TIME - MIN_TIME_TO_SINGULARITY;

/** integral_0^t d tau / s(tau) = ln(T / (T - t)). */
function integralInvS(t: number): number {
  if (t <= 0) return 0;
  if (t <= T_FLOOR) return Math.log(CRITICAL_TIME / (CRITICAL_TIME - t));
  return Math.log(CRITICAL_TIME / MIN_TIME_TO_SINGULARITY) + (t - T_FLOOR) / MIN_TIME_TO_SINGULARITY;
}

/** integral_0^t d tau / sqrt(s(tau)) = 2 (sqrt(T) - sqrt(T - t)). */
function integralInvSqrtS(t: number): number {
  if (t <= 0) return 0;
  if (t <= T_FLOOR) return 2 * (Math.sqrt(CRITICAL_TIME) - Math.sqrt(CRITICAL_TIME - t));
  return (
    2 * (Math.sqrt(CRITICAL_TIME) - Math.sqrt(MIN_TIME_TO_SINGULARITY)) +
    (t - T_FLOOR) / Math.sqrt(MIN_TIME_TO_SINGULARITY)
  );
}

/**
 * integral_0^t sin(w tau) / sqrt(s(tau)) d tau. Has no elementary closed
 * form, but the substitution u = sqrt(T - tau) removes the endpoint
 * singularity and leaves the smooth integrand 2 sin(w (T - u^2)), which
 * Simpson's rule handles to ~1e-5 with 64 intervals.
 */
function pulseIntegral(t: number): number {
  if (t <= 0) return 0;
  const tEnd = Math.min(t, T_FLOOR);
  const u0 = Math.sqrt(CRITICAL_TIME - tEnd);
  const u1 = Math.sqrt(CRITICAL_TIME);
  const intervals = 64;
  const h = (u1 - u0) / intervals;
  const f = (u: number) => 2 * Math.sin(FORCING_PULSE_FREQUENCY * (CRITICAL_TIME - u * u));
  let sum = f(u0) + f(u1);
  for (let i = 1; i < intervals; i++) sum += f(u0 + i * h) * (i % 2 === 0 ? 2 : 4);
  let result = (sum * h) / 3;
  if (t > T_FLOOR) {
    result +=
      (Math.cos(FORCING_PULSE_FREQUENCY * T_FLOOR) - Math.cos(FORCING_PULSE_FREQUENCY * t)) /
      (FORCING_PULSE_FREQUENCY * Math.sqrt(MIN_TIME_TO_SINGULARITY));
  }
  return result;
}

export interface SharedFieldState {
  t: number;
  /** J_r(t): cumulative net radial-strain integral. */
  jr: number;
  /** exp(-J_r(t)): multiplicative radial scale factor shared by all particles. */
  scaleR: number;
  /** exp(+2 J_r(t)): multiplicative axial scale factor shared by all particles. */
  scaleZ: number;
  /** K(t): cumulative swirl integral shared by all particles. */
  kOmega: number;
  /** Current core radius R_core(t). */
  rCore: number;
  /** Current swirl amplitude Omega(t). */
  omega: number;
  /** s(t) = T - t, clamped. */
  s: number;
}

/** Computes the shared (particle-count-independent) integrals for time t — exactly, in O(1) plus one 64-point Simpson rule for the forcing pulse. */
export function computeSharedField(t: number, p: SimParams): SharedFieldState {
  const damping = viscousDamping(p.viscosity);
  const strainAmplitude = (p.radialCompression * RATE_K_RADIAL + (p.axialStretch * RATE_K_AXIAL) / 2) * damping;
  const swirlAmplitude = p.rotationIntensity * RATE_K_SWIRL * damping;
  const jr = strainAmplitude * integralInvS(t);
  const kOmega =
    swirlAmplitude * (integralInvSqrtS(t) + p.forcingInfluence * FORCING_PULSE_AMPLITUDE * pulseIntegral(t));
  const scaleR = Math.exp(-jr);
  const scaleZ = Math.exp(2 * jr);
  return {
    t,
    jr,
    scaleR,
    scaleZ,
    kOmega,
    rCore: R_CORE_0 * scaleR,
    omega: swirlOmega(t, p),
    s: sOf(t),
  };
}

/**
 * The exact axial scale factor exp(2*J_r(t)) is used for every displayed
 * diagnostic and graph (it is the honest number). For actually PLACING
 * particles in the 3D viewport we soft-clamp it with a tanh: growth stays
 * linear (i.e. physically faithful) while it is small and smoothly
 * saturates instead of carrying particles arbitrarily far off-screen. This
 * is purely a rendering convenience, documented here so it is never
 * confused with the underlying model.
 */
export function visualScaleZ(rawScaleZ: number): number {
  const excess = rawScaleZ - 1;
  return 1 + MAX_VISUAL_Z_STRETCH * Math.tanh(excess / MAX_VISUAL_Z_STRETCH);
}

/** g(rho) = 1 - exp(-rho^2), the Burgers/Lamb-Oseen saturation profile. */
export function gShape(rho: number): number {
  return 1 - Math.exp(-rho * rho);
}

/** h(rho0) = g(rho0)/rho0^2, with the removable singularity at rho0 = 0 resolved to 1. */
export function hShape(rho0: number): number {
  if (rho0 < 1e-4) return 1;
  return gShape(rho0) / (rho0 * rho0);
}

export interface ParticleSeed {
  r0: number;
  theta0: number;
  z0: number;
  rho0: number;
  /** A stable per-particle random value in [0,1) for color/size jitter, not physics. */
  seedJitter: number;
  /** Rendering brightness weight of this tracer (dye filament > core > arm sheet > haze). Not physics. */
  intensity: number;
  /** Rendering size multiplier of this tracer. Not physics. */
  sizeMul: number;
}

// --- Tracer seeding ---------------------------------------------------------
// The velocity field is axisymmetric, so tracers spread UNIFORMLY in theta
// stay uniform forever: rotation and differential winding would be
// invisible no matter how fast the flow turns. Like dye streaks in a real
// flow experiment, the tracers are therefore seeded non-axisymmetrically:
//   * dye filaments — thin inclined spiral strands (the "rotating filaments"),
//   * arm sheets    — soft, larger, dimmer sprites forming luminous curtains along the same arms,
//   * a core column — the region that ends up as the singular core,
//   * haze          — big, very faint sprites: a volumetric glow marking the outer envelope.
// Only the tracers' INITIAL POSITIONS are structured; they are advected by
// exactly the same velocity field as before.

/** Initial extent of the tracer cloud: a cylinder of this radius and half-height centered on the vortex axis. */
export const SEED_CLOUD_RADIUS = 2.1;
export const SEED_CLOUD_HALF_HEIGHT = 1.5;

const ARM_COUNT = 5;
/** Radians by which the inner end of an arm already leads its outer end at t = 0 (a vortex that has been turning for a while). */
const ARM_PREWIND = 2.4;
/** Radians of arm rotation per unit height, so the arms are helicoidal rather than flat. */
const ARM_HELIX_TWIST = 0.55;

/** Small deterministic PRNG so the filament LAYOUT is identical on every load; only the tracer positions along it are random. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianRandom(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface FilamentDef {
  phase: number;
  z: number;
  slope: number;
  rMin: number;
  rMax: number;
}

function buildTracerLayout(count: number, radius: number, halfHeight: number) {
  const rnd = mulberry32(20260908);
  const armPhases = Array.from({ length: ARM_COUNT }, (_, k) => (k / ARM_COUNT) * Math.PI * 2 + (rnd() - 0.5) * 0.35);
  const filamentCount = Math.min(48, Math.max(12, Math.round(count / 320)));
  const filaments: FilamentDef[] = [];
  for (let j = 0; j < filamentCount; j++) {
    filaments.push({
      phase: armPhases[j % ARM_COUNT] + (rnd() - 0.5) * 0.24,
      z: (halfHeight - 0.25) * (-1 + (2 * (j + 0.15 + 0.7 * rnd())) / filamentCount),
      slope: (rnd() < 0.5 ? -1 : 1) * (0.18 + 0.3 * rnd()),
      rMin: radius * (0.05 + 0.2 * rnd()),
      rMax: radius * (0.62 + 0.38 * rnd()),
    });
  }
  return { armPhases, filaments };
}

/**
 * Seeds N tracer particles inside a cylinder as dye filaments / arm sheets /
 * core / haze (see the note above). Every tracer still carries only an
 * initial position (r0, theta0, z0); nothing about the flow itself changes.
 */
export function seedParticles(
  count: number,
  radius = SEED_CLOUD_RADIUS,
  halfHeight = SEED_CLOUD_HALF_HEIGHT,
): ParticleSeed[] {
  const { armPhases, filaments } = buildTracerLayout(count, radius, halfHeight);
  const armTheta = (phase: number, r0: number, z0: number) =>
    phase + ARM_PREWIND * (1 - r0 / radius) + ARM_HELIX_TWIST * z0;

  const seeds: ParticleSeed[] = [];
  for (let i = 0; i < count; i++) {
    const pick = Math.random();
    let r0: number;
    let theta0: number;
    let z0: number;
    let intensity: number;
    let sizeMul: number;

    if (pick < 0.46) {
      const f = filaments[Math.floor(Math.random() * filaments.length)];
      r0 = f.rMin + (f.rMax - f.rMin) * Math.pow(Math.random(), 0.85);
      z0 = f.z + f.slope * (r0 - radius * 0.5) + gaussianRandom() * 0.03;
      theta0 = armTheta(f.phase, r0, z0) + (gaussianRandom() * 0.03) / Math.max(r0, 0.2);
      intensity = 1;
      sizeMul = 0.8;
    } else if (pick < 0.7) {
      r0 = radius * (0.08 + 0.92 * Math.sqrt(Math.random()));
      z0 = (Math.random() * 2 - 1) * halfHeight;
      const phase = armPhases[Math.floor(Math.random() * ARM_COUNT)];
      theta0 = armTheta(phase, r0, z0) + (gaussianRandom() * 0.14) / Math.max(r0, 0.3);
      intensity = 0.13;
      sizeMul = 1.7;
    } else if (pick < 0.81) {
      r0 = radius * 0.24 * Math.sqrt(Math.random());
      z0 = (Math.random() * 2 - 1) * halfHeight;
      theta0 = Math.random() * Math.PI * 2;
      intensity = 0.65;
      sizeMul = 0.8;
    } else {
      r0 = radius * Math.sqrt(Math.random());
      z0 = (Math.random() * 2 - 1) * halfHeight;
      theta0 = Math.random() * Math.PI * 2;
      intensity = 0.03;
      sizeMul = 2.1;
    }

    seeds.push({ r0, theta0, z0, rho0: r0 / R_CORE_0, seedJitter: Math.random(), intensity, sizeMul });
  }
  return seeds;
}

export interface ParticleKinematics {
  r: number;
  theta: number;
  z: number;
  x: number;
  y: number;
  vTheta: number;
  angularVelocity: number;
  vR: number;
  vZ: number;
  speed: number;
  vorticityZ: number;
}

/** Maps one particle's seed to its full kinematic state at time t, given the shared field. */
export function evaluateParticle(seed: ParticleSeed, field: SharedFieldState, p: SimParams): ParticleKinematics {
  const r = seed.r0 * field.scaleR;
  const z = seed.z0 * field.scaleZ;
  const h = hShape(seed.rho0);
  const theta = seed.theta0 + h * field.kOmega;

  const netC = netRadialCoefficient(field.t, p);
  const vR = -netC * r;
  const vZ = 2 * netC * z;
  const angularVelocity = field.omega * h;
  const vTheta = angularVelocity * r;
  const speed = Math.sqrt(vR * vR + vZ * vZ + vTheta * vTheta);
  const vorticityZ = (2 * field.omega / Math.max(field.rCore, 1e-4)) * Math.exp(-seed.rho0 * seed.rho0);

  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);

  return { r, theta, z, x, y, vTheta, angularVelocity, vR, vZ, speed, vorticityZ };
}

export interface EulerianFieldSample {
  vR: number;
  vTheta: number;
  vZ: number;
  /** Cartesian components in the app's three.js convention: x = r cos(theta), three.y = z, three.z = r sin(theta). */
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  vorticityZ: number;
  angularVelocity: number;
  /** Net radial straining rate C_r(t) = -vR/r: in this linear-strain toy model it is spatially uniform (the same everywhere), which is itself worth surfacing to a probing user. */
  compressionIndicator: number;
}

/**
 * Evaluates the EULERIAN velocity field u(r, theta, z, t) at a fixed spatial
 * point (not following any particle trajectory) — used by the field probe,
 * the velocity-vector glyphs, section-plane slices, and streamline
 * integration, so all four features read from one shared formula.
 */
export function evaluateEulerianField(r: number, theta: number, z: number, t: number, p: SimParams): EulerianFieldSample {
  const field = computeSharedField(t, p);
  const netC = netRadialCoefficient(t, p);
  const rho = r / Math.max(field.rCore, 1e-6);
  const ratio = rho < 1e-4 ? rho : gShape(rho) / rho;
  const vTheta = field.omega * field.rCore * ratio;
  const vR = -netC * r;
  const vZ = 2 * netC * z;

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const vx = vR * cosT - vTheta * sinT;
  const vz = vR * sinT + vTheta * cosT;
  const vy = vZ;

  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const vorticityZ = (2 * field.omega) / Math.max(field.rCore, 1e-4) * Math.exp(-rho * rho);
  const angularVelocity = r > 1e-6 ? vTheta / r : field.omega * ratio;

  return { vR, vTheta, vZ, vx, vy, vz, speed, vorticityZ, angularVelocity, compressionIndicator: netC };
}

// --- shape constants for diagnostics, found once by a coarse numeric scan ---
const { peakRho, peakFactor, energyShapeIntegral } = (() => {
  let bestRho = 1;
  let bestVal = 0;
  let energyIntegral = 0;
  const steps = 4000;
  const upper = 9;
  const dRho = upper / steps;
  for (let i = 1; i <= steps; i++) {
    const rho = i * dRho;
    const val = gShape(rho) / rho;
    if (val > bestVal) {
      bestVal = val;
      bestRho = rho;
    }
    // integrand for energy ~ integral (g(rho)/rho)^2 * rho d rho = integral g(rho)^2/rho d rho
    energyIntegral += ((gShape(rho) * gShape(rho)) / rho) * dRho;
  }
  return { peakRho: bestRho, peakFactor: bestVal, energyShapeIntegral: energyIntegral };
})();

export interface Diagnostics {
  t: number;
  timeToSingularity: number;
  maxVelocity: number;
  vorticityIndex: number;
  radialScale: number;
  axialScale: number;
  kineticEnergyIndex: number;
  viscosity: number;
}

/**
 * All diagnostic numbers shown in the live data panel and graphs are pure
 * functions of (t, params) — nothing here is randomized or historical.
 */
export function computeDiagnostics(t: number, p: SimParams): Diagnostics {
  const field = computeSharedField(t, p);
  const maxVelocity = field.omega * field.rCore * peakFactor;
  const vorticityIndex = (2 * field.omega) / Math.max(field.rCore, 1e-4);
  // Energy per unit length ~ Omega^2 * R_core^4 * shape integral (bounded for all finite t).
  const kineticEnergyIndex = field.omega * field.omega * Math.pow(field.rCore, 4) * energyShapeIntegral * 4;
  return {
    t,
    timeToSingularity: field.s,
    maxVelocity,
    vorticityIndex,
    radialScale: field.rCore,
    axialScale: field.scaleZ,
    kineticEnergyIndex,
    viscosity: p.viscosity,
  };
}

export const PEAK_RHO_FOR_MAX_VELOCITY = peakRho;

/**
 * Fixed, deterministic quadrature grid used ONLY for the spatial-mean
 * diagnostics below (meanVelocity, meanVorticity). This is intentionally
 * NOT the randomized particle-seed cloud used for rendering — it is a small
 * set of representative (rho0, z0) sample points, chosen once, so repeated
 * calls with the same (t, params) always return exactly the same mean
 * (research/export code must never depend on Math.random).
 */
const MEAN_GRID_RHO0 = [0.05, 0.3, 0.55, 0.8, 1.05, 1.3, 1.6, 2.0, 2.5, 3.0];
const MEAN_GRID_Z0 = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];

export interface ExtendedDiagnostics extends Diagnostics {
  /** Mean speed |u| over the fixed representative grid (not the render particle cloud). */
  meanVelocity: number;
  /** Mean vorticity proxy over the same grid. */
  meanVorticity: number;
  /** = field.scaleR: dimensionless radial compression factor (1 at t=0, shrinking toward 0). */
  compressionFactor: number;
  /** = field.scaleZ, the exact (uncapped) axial stretch factor — can be large near T. */
  stretchFactorRaw: number;
  /** The same quantity after the tanh soft-clamp actually used to place particles on screen. */
  stretchFactorVisual: number;
  /** True when stretchFactorRaw and stretchFactorVisual differ meaningfully — i.e. the picture is a clamped rendering, not the raw mathematical value. */
  visualizationClamped: boolean;
}

/**
 * Extends computeDiagnostics with spatial-mean quantities and explicit
 * compression/stretch/clamping bookkeeping, for the research/experiment
 * tooling. Still a pure function of (t, params) — no randomness, no history.
 */
export function computeExtendedDiagnostics(t: number, p: SimParams): ExtendedDiagnostics {
  const base = computeDiagnostics(t, p);
  const field = computeSharedField(t, p);
  const netC = netRadialCoefficient(t, p);

  let sumSpeed = 0;
  let sumVorticity = 0;
  let count = 0;
  for (const rho0 of MEAN_GRID_RHO0) {
    const h = hShape(rho0);
    const r = rho0 * R_CORE_0 * field.scaleR;
    const angularVelocity = field.omega * h;
    const vorticity = (2 * field.omega) / Math.max(field.rCore, 1e-4) * Math.exp(-rho0 * rho0);
    for (const z0 of MEAN_GRID_Z0) {
      const z = z0 * field.scaleZ;
      const vR = -netC * r;
      const vZ = 2 * netC * z;
      const vTheta = angularVelocity * r;
      const speed = Math.sqrt(vR * vR + vZ * vZ + vTheta * vTheta);
      sumSpeed += speed;
      sumVorticity += vorticity;
      count++;
    }
  }

  const stretchFactorRaw = field.scaleZ;
  const stretchFactorVisual = visualScaleZ(stretchFactorRaw);
  const visualizationClamped = Math.abs(stretchFactorRaw - stretchFactorVisual) > 0.05;

  return {
    ...base,
    meanVelocity: sumSpeed / count,
    meanVorticity: sumVorticity / count,
    compressionFactor: field.scaleR,
    stretchFactorRaw,
    stretchFactorVisual,
    visualizationClamped,
  };
}

/**
 * Lamb-Oseen-style viscous DECAY model used for the "expected" / normal
 * comparison panels: a real exact-solution family where viscosity spreads
 * and weakens a vortex core (radius grows like sqrt(1 + 6 nu t), peak swirl
 * decays exponentially) instead of concentrating it. Uses the same
 * self-similar rho0 trick as the main model, so it is just as cheap to
 * evaluate for thousands of particles.
 */
export interface DecayingFieldState {
  rCore: number;
  omega: number;
  scaleR: number;
  kOmega: number;
}

export function computeDecayingSharedField(t: number, viscosity: number): DecayingFieldState {
  const nu = Math.max(viscosity, 0.02);
  const omega0 = swirlOmega(0, DEFAULT_PARAMS);
  const decayRate = nu / 1.4;
  const rCore = R_CORE_0 * Math.sqrt(1 + nu * t * 6);
  const omega = omega0 * Math.exp(-decayRate * t);
  // Closed form of integral_0^t omega0 * exp(-decayRate * tau) d tau.
  const kOmega = (omega0 / decayRate) * (1 - Math.exp(-decayRate * t));
  return { rCore, omega, scaleR: rCore / R_CORE_0, kOmega };
}
