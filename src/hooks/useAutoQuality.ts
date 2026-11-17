import { useEffect } from 'react';
import { useSimStore } from './useSimStore';

/**
 * Runs once on startup to pick a sensible starting quality tier and particle
 * count for the current device, so a low-power or mobile device doesn't
 * open straight into a 14,000-particle scene it can't render at 60fps. The
 * user's own choice on the quality/particle-count controls always overrides
 * this afterwards — this only sets the initial default.
 */
export function useAutoQuality() {
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const isNarrow = window.innerWidth < 768;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isMobileLike = isNarrow || isCoarsePointer;

    let quality: 'low' | 'medium' | 'high' = 'high';
    let particleCount = 14000;

    if (isMobileLike && cores <= 4) {
      quality = 'low';
      particleCount = 4000;
    } else if (isMobileLike || cores <= 4) {
      quality = 'medium';
      particleCount = 8000;
    }

    if (quality !== 'high') {
      useSimStore.getState().setQuality(quality);
    }
    if (particleCount !== 14000) {
      useSimStore.getState().setParam('particleCount', particleCount);
    }
  }, []);
}
