import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExperimentRun } from '../types/experiment';

const STORAGE_KEY = 'nvst.experiments.v1';
const MAX_STORED_EXPERIMENTS = 60;

interface ExperimentStoreState {
  runs: ExperimentRun[];
  selectedForCompare: string[];
  storageError: string | null;
  addRun: (run: ExperimentRun) => void;
  removeRun: (id: string) => void;
  renameRun: (id: string, name: string) => void;
  setNote: (id: string, note: string) => void;
  toggleCompareSelection: (id: string) => void;
  clearCompareSelection: () => void;
  clearStorageError: () => void;
}

/**
 * Saved experiments persist to localStorage via zustand's persist
 * middleware (no backend). Reads/writes are wrapped so a full or disabled
 * localStorage (private browsing, quota exceeded) degrades to a Georgian
 * error message instead of a crash or a silently-lost experiment.
 */
export const useExperimentStore = create<ExperimentStoreState>()(
  persist(
    (set) => ({
      runs: [],
      selectedForCompare: [],
      storageError: null,

      addRun: (run) =>
        set((s) => {
          const runs = [run, ...s.runs].slice(0, MAX_STORED_EXPERIMENTS);
          return { runs };
        }),
      removeRun: (id) =>
        set((s) => ({
          runs: s.runs.filter((r) => r.metadata.id !== id),
          selectedForCompare: s.selectedForCompare.filter((x) => x !== id),
        })),
      renameRun: (id, name) =>
        set((s) => ({
          runs: s.runs.map((r) => (r.metadata.id === id ? { ...r, metadata: { ...r.metadata, name } } : r)),
        })),
      setNote: (id, note) =>
        set((s) => ({
          runs: s.runs.map((r) => (r.metadata.id === id ? { ...r, metadata: { ...r.metadata, note } } : r)),
        })),
      toggleCompareSelection: (id) =>
        set((s) => {
          const has = s.selectedForCompare.includes(id);
          if (has) return { selectedForCompare: s.selectedForCompare.filter((x) => x !== id) };
          if (s.selectedForCompare.length >= 4) return {};
          return { selectedForCompare: [...s.selectedForCompare, id] };
        }),
      clearCompareSelection: () => set({ selectedForCompare: [] }),
      clearStorageError: () => set({ storageError: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ runs: s.runs }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          useExperimentStore.setState({
            storageError: 'შენახული ექსპერიმენტების ჩატვირთვა ვერ მოხერხდა — ბრაუზერის საცავი შესაძლოა დაზიანებულია ან გამორთულია.',
          });
        }
      },
    },
  ),
);

/** Wraps addRun with try/catch so a full/blocked localStorage surfaces a Georgian message instead of throwing. */
export function saveExperimentSafely(run: ExperimentRun): { ok: boolean; error?: string } {
  try {
    useExperimentStore.getState().addRun(run);
    return { ok: true };
  } catch {
    useExperimentStore.setState({
      storageError: 'ექსპერიმენტის შენახვა ვერ მოხერხდა — შესაძლოა ბრაუზერის საცავი სავსეა ან გამორთულია (მაგ. პირად რეჟიმში).',
    });
    return { ok: false, error: 'storage-failed' };
  }
}
