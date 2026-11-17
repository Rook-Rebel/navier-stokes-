import type { QualityLevel } from '../hooks/useSimStore';
import type { SimParams } from '../utils/flowField';

/** How the recorded time interval was sampled — resolution of the EXPORTED/RECORDED data, not the analytical model itself. */
export type SamplingMode = 'timeStep' | 'sampleCount';

export interface SamplingConfig {
  mode: SamplingMode;
  /** Used when mode === 'timeStep' — e.g. 0.01 / 0.005 / 0.001. */
  timeStep: number;
  /** Used when mode === 'sampleCount' — e.g. 100 / 250 / 500 / 1000. */
  sampleCount: number;
  startT: number;
  endT: number;
}

export const DIAGNOSTIC_KEYS = [
  't',
  'timeToSingularity',
  'maxVelocity',
  'meanVelocity',
  'maxVorticity',
  'meanVorticity',
  'coreRadius',
  'axialScale',
  'compressionFactor',
  'stretchFactor',
  'kineticEnergyIndex',
  'viscosity',
  'forcing',
] as const;

export type DiagnosticKey = (typeof DIAGNOSTIC_KEYS)[number];

/** One recorded row of a run. Every field is deterministically derived from (t, params) — never randomized. */
export interface DiagnosticSample {
  t: number;
  timeToSingularity: number;
  maxVelocity: number;
  meanVelocity: number;
  maxVorticity: number;
  meanVorticity: number;
  coreRadius: number;
  axialScale: number;
  compressionFactor: number;
  stretchFactor: number;
  kineticEnergyIndex: number;
  viscosity: number;
  forcing: number;
  /** Finite-difference d(maxVelocity)/dt between this sample and the previous one; null for the first sample. */
  rateOfChange: number | null;
  /** True if stretchFactor is the tanh-soft-clamped rendering value rather than the raw mathematical scale factor. */
  visualizationClamped: boolean;
}

export interface ExperimentMetadata {
  id: string;
  name: string;
  createdAt: string;
  modelVersion: string;
  params: SimParams;
  sampling: SamplingConfig;
  quality: QualityLevel;
  selectedDiagnostics: DiagnosticKey[];
  note: string;
  /** The preset this experiment was based on, if any ("custom" otherwise). */
  presetId: string;
}

export interface ExperimentRun {
  metadata: ExperimentMetadata;
  samples: DiagnosticSample[];
  generatedAt: string;
}

export function createExperimentId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
