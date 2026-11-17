import { MODEL_VERSION } from './flowField';
import type { ExperimentRun } from '../types/experiment';

const CSV_COLUMNS: (keyof ExperimentRun['samples'][number])[] = [
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
  'rateOfChange',
  'visualizationClamped',
];

/** Never emits NaN/Infinity/undefined into exported data — clamped/undefined numeric cells become an explicit empty cell instead. */
function safeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!isFinite(value)) return '';
    return String(value);
  }
  return String(value);
}

export function buildCsv(run: ExperimentRun): string {
  const lines: string[] = [];
  lines.push(`# ნავიე-სტოქსის სინგულარობა — ექსპერიმენტი: ${run.metadata.name}`);
  lines.push(`# id=${run.metadata.id} modelVersion=${run.metadata.modelVersion} generatedAt=${run.generatedAt}`);
  lines.push(CSV_COLUMNS.join(','));
  for (const sample of run.samples) {
    lines.push(CSV_COLUMNS.map((c) => safeCell(sample[c])).join(','));
  }
  return lines.join('\n');
}

export interface ExportedJson {
  model: string;
  modelVersion: string;
  experiment: {
    id: string;
    name: string;
    createdAt: string;
    note: string;
    presetId: string;
  };
  parameters: ExperimentRun['metadata']['params'];
  sampling: ExperimentRun['metadata']['sampling'];
  assumptions: string[];
  generatedAt: string;
  samples: ExperimentRun['samples'];
}

export const MODEL_ASSUMPTIONS_EN = [
  'Reduced educational model: an explicitly divergence-free toy velocity field, not a direct numerical solver (no DNS/finite-volume/finite-element discretization).',
  'Does not reproduce or numerically verify the 2026 finite-time blow-up proof or its Lean formalization.',
  'Vorticity is a closed-form analytic proxy derived from the model swirl profile, not computed via curl of a discretized field.',
  'Parameter sweeps and presets are exploratory illustrations of the toy model, not a physical parameter study of the Navier-Stokes equations.',
  'All arithmetic uses standard browser IEEE-754 double precision.',
  'Values shown for particle rendering near t -> T are soft-clamped for on-screen display (see visualizationClamped); the underlying raw mathematical values are still recorded separately where relevant.',
];

export function buildExportJson(run: ExperimentRun): ExportedJson {
  return {
    model: 'navier-stokes-singularity-toy-model',
    modelVersion: MODEL_VERSION,
    experiment: {
      id: run.metadata.id,
      name: run.metadata.name,
      createdAt: run.metadata.createdAt,
      note: run.metadata.note,
      presetId: run.metadata.presetId,
    },
    parameters: run.metadata.params,
    sampling: run.metadata.sampling,
    assumptions: MODEL_ASSUMPTIONS_EN,
    generatedAt: run.generatedAt,
    samples: run.samples,
  };
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeFileNamePart(name: string): string {
  return name.replace(/[^a-zA-Z0-9а-яА-Яა-ჰ_-]+/g, '_').slice(0, 60) || 'experiment';
}

export function downloadCsv(run: ExperimentRun) {
  downloadTextFile(`${safeFileNamePart(run.metadata.name)}.csv`, buildCsv(run), 'text/csv;charset=utf-8');
}

export function downloadJson(run: ExperimentRun) {
  downloadTextFile(
    `${safeFileNamePart(run.metadata.name)}.json`,
    JSON.stringify(buildExportJson(run), null, 2),
    'application/json;charset=utf-8',
  );
}
