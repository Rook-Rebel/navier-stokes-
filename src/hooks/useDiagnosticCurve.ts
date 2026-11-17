import { useMemo } from 'react';
import { computeDiagnostics, Diagnostics, MAX_SIM_TIME, SimParams } from '../utils/flowField';

const SAMPLE_COUNT = 90;

/**
 * Produces the full diagnostics curve over [0, MAX_SIM_TIME] for the given
 * params. Since every diagnostic is a pure function of (t, params), the
 * whole curve can be recomputed deterministically instead of being recorded
 * as playback history — this is what lets graphs and sparklines stay
 * correct immediately after the timeline is scrubbed.
 */
export function useDiagnosticCurve(params: SimParams): Diagnostics[] {
  return useMemo(() => {
    const out: Diagnostics[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const t = (i / (SAMPLE_COUNT - 1)) * MAX_SIM_TIME;
      out.push(computeDiagnostics(t, params));
    }
    return out;
  }, [params]);
}

export { SAMPLE_COUNT };
