import { useEffect } from 'react';
import { useSimStore, type CameraPreset } from './useSimStore';

const NUMBER_PRESETS: Record<string, CameraPreset> = {
  '1': 'full',
  '2': 'top',
  '3': 'side',
  '4': 'core',
  '5': 'trajectory',
};

/** Global keyboard shortcuts: Space play/pause, R reset, ←/→ step, 1–5 camera presets. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const store = useSimStore.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        store.togglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        store.reset();
      } else if (e.key === 'ArrowLeft') {
        store.step(-1);
      } else if (e.key === 'ArrowRight') {
        store.step(1);
      } else if (NUMBER_PRESETS[e.key]) {
        store.requestCameraPreset(NUMBER_PRESETS[e.key]);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
