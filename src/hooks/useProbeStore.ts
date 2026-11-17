import { create } from 'zustand';

export interface FieldProbe {
  id: string;
  x: number;
  y: number;
  z: number;
}

export const PROBE_COLORS = ['#4fa8db', '#c98a4a', '#a184c9', '#3aa08c', '#d97878'];
const MAX_PROBES = 5;

interface ProbeStoreState {
  placing: boolean;
  probes: FieldProbe[];
  togglePlacing: () => void;
  setPlacing: (v: boolean) => void;
  addProbe: (x: number, y: number, z: number) => void;
  removeProbe: (id: string) => void;
  clearProbes: () => void;
}

export const useProbeStore = create<ProbeStoreState>((set) => ({
  placing: false,
  probes: [],
  togglePlacing: () => set((s) => ({ placing: !s.placing })),
  setPlacing: (v) => set({ placing: v }),
  addProbe: (x, y, z) =>
    set((s) => {
      if (s.probes.length >= MAX_PROBES) return {};
      return { probes: [...s.probes, { id: `probe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, x, y, z }] };
    }),
  removeProbe: (id) => set((s) => ({ probes: s.probes.filter((p) => p.id !== id) })),
  clearProbes: () => set({ probes: [] }),
}));

export { MAX_PROBES };
