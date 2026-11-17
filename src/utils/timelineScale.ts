import { MAX_SIM_TIME } from './flowField';

/**
 * "ბოლო მონაკვეთის გაშლა" — a piecewise-linear reparametrization of the
 * timeline: t in [0, BREAK_T] maps to the first BREAK_FRACTION of the track,
 * and t in [BREAK_T, MAX_SIM_TIME] maps to the remaining, much wider,
 * fraction — so the rapid final approach to the singularity can be scrubbed
 * with real precision instead of being squeezed into the last few pixels of
 * a linear slider. The native <input type="range"> still operates on a
 * plain 0..1 fraction; only the t <-> fraction conversion is non-linear.
 */
export const EXPAND_BREAK_T = 0.9;
export const EXPAND_BREAK_FRACTION = 0.16;

export function tToFraction(t: number, expanded: boolean): number {
  if (!expanded) return t / MAX_SIM_TIME;
  if (t <= EXPAND_BREAK_T) {
    return (t / EXPAND_BREAK_T) * EXPAND_BREAK_FRACTION;
  }
  const localT = (t - EXPAND_BREAK_T) / (MAX_SIM_TIME - EXPAND_BREAK_T);
  return EXPAND_BREAK_FRACTION + localT * (1 - EXPAND_BREAK_FRACTION);
}

export function fractionToT(frac: number, expanded: boolean): number {
  if (!expanded) return frac * MAX_SIM_TIME;
  if (frac <= EXPAND_BREAK_FRACTION) {
    return (frac / EXPAND_BREAK_FRACTION) * EXPAND_BREAK_T;
  }
  const localFrac = (frac - EXPAND_BREAK_FRACTION) / (1 - EXPAND_BREAK_FRACTION);
  return EXPAND_BREAK_T + localFrac * (MAX_SIM_TIME - EXPAND_BREAK_T);
}

export const TIMELINE_MARKS = [0, 0.5, 0.9, 0.99, MAX_SIM_TIME] as const;
