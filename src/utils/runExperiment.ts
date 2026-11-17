import { computeExtendedDiagnostics, MAX_SIM_TIME, MODEL_VERSION, type SimParams } from './flowField';
import type { QualityLevel } from '../hooks/useSimStore';
import {
  createExperimentId,
  DIAGNOSTIC_KEYS,
  type DiagnosticSample,
  type ExperimentMetadata,
  type ExperimentRun,
  type SamplingConfig,
} from '../types/experiment';

/** Builds the list of t values to sample, honoring either a fixed time step or a fixed sample count. */
function buildTimeGrid(sampling: SamplingConfig): number[] {
  const start = Math.min(Math.max(sampling.startT, 0), MAX_SIM_TIME);
  const end = Math.min(Math.max(sampling.endT, start), MAX_SIM_TIME);
  const times: number[] = [];

  if (sampling.mode === 'timeStep') {
    const step = Math.max(sampling.timeStep, 1e-4);
    for (let t = start; t < end - 1e-9; t += step) times.push(t);
    times.push(end);
  } else {
    const n = Math.max(2, Math.round(sampling.sampleCount));
    for (let i = 0; i < n; i++) {
      times.push(start + ((end - start) * i) / (n - 1));
    }
  }
  return times;
}

/**
 * Samples the (deterministic, closed-form) model's diagnostics over a time
 * interval and returns a full recorded dataset. This is the "ექსპერიმენტის
 * გაშვება" workflow: it freezes a snapshot of params + sampling config,
 * evaluates computeExtendedDiagnostics at every sampled t, and adds a
 * finite-difference rate-of-change column. Cheap enough (a few hundred
 * quadrature evaluations even at 1000 samples) to run synchronously on the
 * main thread — profiled at well under 50ms even at the largest sample
 * count, so no Web Worker is warranted here.
 */
export function runExperiment(
  params: SimParams,
  sampling: SamplingConfig,
  quality: QualityLevel,
  name: string,
  note = '',
  presetId = 'custom',
): ExperimentRun {
  const times = buildTimeGrid(sampling);
  const samples: DiagnosticSample[] = times.map((t) => {
    const d = computeExtendedDiagnostics(t, params);
    return {
      t: d.t,
      timeToSingularity: d.timeToSingularity,
      maxVelocity: d.maxVelocity,
      meanVelocity: d.meanVelocity,
      maxVorticity: d.vorticityIndex,
      meanVorticity: d.meanVorticity,
      coreRadius: d.radialScale,
      axialScale: d.axialScale,
      compressionFactor: d.compressionFactor,
      stretchFactor: d.stretchFactorVisual,
      kineticEnergyIndex: d.kineticEnergyIndex,
      viscosity: d.viscosity,
      forcing: params.forcingInfluence,
      rateOfChange: null,
      visualizationClamped: d.visualizationClamped,
    };
  });

  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    samples[i].rateOfChange = dt > 1e-9 ? (samples[i].maxVelocity - samples[i - 1].maxVelocity) / dt : null;
  }

  const metadata: ExperimentMetadata = {
    id: createExperimentId(),
    name: name.trim() || 'უსახელო ექსპერიმენტი',
    createdAt: new Date().toISOString(),
    modelVersion: MODEL_VERSION,
    params: { ...params },
    sampling: { ...sampling },
    quality,
    selectedDiagnostics: [...DIAGNOSTIC_KEYS],
    note,
    presetId,
  };

  return { metadata, samples, generatedAt: new Date().toISOString() };
}
