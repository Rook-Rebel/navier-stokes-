import { DEFAULT_PARAMS, PARAM_RANGES, type SimParams } from './flowField';

const CODE_PREFIX = 'NVST-1-';

// Fixed field order keeps the encoded array compact and stable across versions.
const FIELD_ORDER: (keyof SimParams)[] = [
  'viscosity',
  'radialCompression',
  'axialStretch',
  'rotationIntensity',
  'forcingInfluence',
  'particleCount',
  'trailLength',
  'visualSpeed',
];

// Browser-only (per project constraints there is no Node/server runtime to fall back to).
function toBase64Url(json: string): string {
  const b64 = window.btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(window.atob(padded)));
}

/** Encodes a parameter set into a short, deterministic reproducibility code like "NVST-1-eyJ2...". */
export function encodeExperimentCode(params: SimParams): string {
  const values = FIELD_ORDER.map((k) => params[k]);
  return CODE_PREFIX + toBase64Url(JSON.stringify(values));
}

export interface DecodeResult {
  ok: boolean;
  params?: SimParams;
  error?: string;
}

/** Decodes a reproducibility code back into a validated SimParams object. Never throws — reports a Georgian error instead. */
export function decodeExperimentCode(code: string): DecodeResult {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CODE_PREFIX)) {
    return { ok: false, error: 'კოდი უცნობი ფორმატისაა — ის უნდა იწყებოდეს „NVST-1-“-ით.' };
  }
  const payload = trimmed.slice(CODE_PREFIX.length);
  let values: unknown;
  try {
    values = JSON.parse(fromBase64Url(payload));
  } catch {
    return { ok: false, error: 'კოდის გაშიფვრა ვერ მოხერხდა — შეამოწმეთ, სწორად დააკოპირეთ თუ არა.' };
  }
  if (!Array.isArray(values) || values.length !== FIELD_ORDER.length) {
    return { ok: false, error: 'კოდი არასრულია ან დაზიანებულია.' };
  }
  const params = { ...DEFAULT_PARAMS };
  for (let i = 0; i < FIELD_ORDER.length; i++) {
    const key = FIELD_ORDER[i];
    const raw = values[i];
    if (typeof raw !== 'number' || !isFinite(raw)) {
      return { ok: false, error: `არასწორი მნიშვნელობა პარამეტრისთვის: ${key}.` };
    }
    const range = (PARAM_RANGES as Record<string, { min: number; max: number } | undefined>)[key];
    if (range && (raw < range.min - 1e-6 || raw > range.max + 1e-6)) {
      return { ok: false, error: `მნიშვნელობა პარამეტრისთვის „${key}“ დასაშვები დიაპაზონის გარეთაა.` };
    }
    (params as SimParams)[key] = raw;
  }
  return { ok: true, params };
}
