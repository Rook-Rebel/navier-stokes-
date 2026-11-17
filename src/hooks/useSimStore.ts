import { create } from 'zustand';
import { DEFAULT_PARAMS, MAX_SIM_TIME, ParticleSeed, SimParams, seedParticles } from '../utils/flowField';
import type { ColorMapping } from '../utils/colorScale';

export type VisualizationMode =
  | 'particles'
  | 'trajectories'
  | 'velocity'
  | 'vorticity'
  | 'energy'
  | 'comparison';

export type QualityLevel = 'low' | 'medium' | 'high';

export type CameraPreset = 'full' | 'top' | 'side' | 'core' | 'trajectory' | 'inside';

const DEFAULT_COLOR_MODE_FOR_MODE: Record<VisualizationMode, ColorMapping> = {
  particles: 'angular',
  trajectories: 'angular',
  velocity: 'angular',
  vorticity: 'vorticity',
  energy: 'speed',
  comparison: 'angular',
};

export type EquationTerm =
  | 'dt'
  | 'advection'
  | 'pressure'
  | 'viscosity'
  | 'forcing'
  | 'divfree'
  | null;

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export type VectorDensity = 'low' | 'medium' | 'high';
export type VectorScaleMode = 'real' | 'normalized';

interface SelectedParticleInfo {
  index: number;
}

interface SimStoreState {
  t: number;
  playing: boolean;
  speed: number;
  mode: VisualizationMode;
  quality: QualityLevel;
  params: SimParams;
  /** Shared particle seeds — a single source of truth so the renderer and the hover/click inspector always agree on which particle is which. Regenerated only when particleCount changes. */
  seeds: ParticleSeed[];
  selectedParticle: SelectedParticleInfo | null;
  hoveredParticleIndex: number | null;
  highlightedTerm: EquationTerm;
  cameraPresetRequest: { preset: CameraPreset; nonce: number } | null;
  finalStageMode: boolean;
  stepIndex: number | null;
  /** "ფერი ასახავს" — independent of visualization mode; setMode picks a sensible default, the user can override it. */
  colorMode: ColorMapping;
  /** "ვექტორების სიმჭიდროვე" for the velocity-field mode. */
  vectorDensity: VectorDensity;
  /** "რეალური მასშტაბი" vs "ნორმალიზებული ვექტორები" for the velocity-field mode. */
  vectorScaleMode: VectorScaleMode;
  /** "ბოლო მონაკვეთის გაშლა" — remaps t in [0.9, T] across most of the timeline track. */
  timelineExpanded: boolean;
  /** "ანოტაციები" — floating labels tracking regions of the 3D scene. */
  annotationsEnabled: boolean;
  /** "ფოკუსი" — fades non-essential UI until hovered. */
  focusMode: boolean;
  /** "ავტომატური კამერა" — slow autonomous orbit tied to simulation stage. */
  autoCamera: boolean;
  /** "პრეზენტაცია" — auto-advances through the guided stages on a timer. */
  presentationPlaying: boolean;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  reset: () => void;
  step: (direction?: 1 | -1) => void;
  setT: (t: number) => void;
  setSpeed: (speed: number) => void;
  setMode: (mode: VisualizationMode) => void;
  setQuality: (quality: QualityLevel) => void;
  setParam: <K extends keyof SimParams>(key: K, value: SimParams[K]) => void;
  resetParams: () => void;
  selectParticle: (index: number | null) => void;
  setHoveredParticle: (index: number | null) => void;
  setHighlightedTerm: (term: EquationTerm) => void;
  requestCameraPreset: (preset: CameraPreset) => void;
  enterFinalStageMode: () => void;
  exitFinalStageMode: () => void;
  setStepIndex: (index: number | null) => void;
  advanceTime: (deltaSeconds: number) => void;
  setColorMode: (mode: ColorMapping) => void;
  setVectorDensity: (density: VectorDensity) => void;
  setVectorScaleMode: (mode: VectorScaleMode) => void;
  toggleTimelineExpanded: () => void;
  toggleAnnotations: () => void;
  toggleFocusMode: () => void;
  toggleAutoCamera: () => void;
  setPresentationPlaying: (playing: boolean) => void;
}

const STEP_TIMES = [0.02, 0.32, 0.62, 0.83, 0.965];

export const useSimStore = create<SimStoreState>((set, get) => ({
  t: 0,
  playing: false,
  speed: 1,
  mode: 'particles',
  quality: 'high',
  params: { ...DEFAULT_PARAMS },
  seeds: seedParticles(DEFAULT_PARAMS.particleCount),
  selectedParticle: null,
  hoveredParticleIndex: null,
  highlightedTerm: null,
  cameraPresetRequest: null,
  finalStageMode: false,
  stepIndex: null,
  colorMode: 'angular',
  vectorDensity: 'medium',
  vectorScaleMode: 'real',
  timelineExpanded: false,
  annotationsEnabled: false,
  focusMode: false,
  autoCamera: false,
  presentationPlaying: false,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  reset: () =>
    set({
      t: 0,
      playing: false,
      finalStageMode: false,
      stepIndex: null,
      selectedParticle: null,
    }),
  step: (direction = 1) =>
    set((s) => ({
      t: Math.min(Math.max(s.t + direction * 0.004, 0), MAX_SIM_TIME),
      playing: false,
    })),
  setT: (t) => set({ t: Math.min(Math.max(t, 0), MAX_SIM_TIME) }),
  setSpeed: (speed) => set({ speed }),
  setMode: (mode) => set({ mode, colorMode: DEFAULT_COLOR_MODE_FOR_MODE[mode] }),
  setQuality: (quality) => set({ quality }),
  setParam: (key, value) =>
    set((s) => ({
      params: { ...s.params, [key]: value },
      seeds: key === 'particleCount' ? seedParticles(value as number) : s.seeds,
      selectedParticle: key === 'particleCount' ? null : s.selectedParticle,
    })),
  resetParams: () =>
    set((s) => ({
      params: { ...DEFAULT_PARAMS },
      seeds: s.params.particleCount === DEFAULT_PARAMS.particleCount ? s.seeds : seedParticles(DEFAULT_PARAMS.particleCount),
    })),
  selectParticle: (index) => set({ selectedParticle: index === null ? null : { index } }),
  setHoveredParticle: (index) => set({ hoveredParticleIndex: index }),
  setHighlightedTerm: (term) => set({ highlightedTerm: term }),
  requestCameraPreset: (preset) =>
    set({ cameraPresetRequest: { preset, nonce: Date.now() + Math.random() } }),
  enterFinalStageMode: () =>
    set({ finalStageMode: true, playing: true, speed: 0.25, t: 0.9 }),
  exitFinalStageMode: () => set({ finalStageMode: false, speed: 1 }),
  setStepIndex: (index) =>
    set(() => ({
      stepIndex: index,
      t: index === null ? get().t : STEP_TIMES[index],
      playing: false,
    })),
  advanceTime: (deltaSeconds) =>
    set((s) => {
      if (!s.playing) return {};
      const next = s.t + deltaSeconds * s.speed * s.params.visualSpeed * 0.12;
      if (next >= MAX_SIM_TIME) {
        return { t: MAX_SIM_TIME, playing: false };
      }
      return { t: next };
    }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setVectorDensity: (density) => set({ vectorDensity: density }),
  setVectorScaleMode: (mode) => set({ vectorScaleMode: mode }),
  toggleTimelineExpanded: () => set((s) => ({ timelineExpanded: !s.timelineExpanded })),
  toggleAnnotations: () => set((s) => ({ annotationsEnabled: !s.annotationsEnabled })),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleAutoCamera: () => set((s) => ({ autoCamera: !s.autoCamera })),
  setPresentationPlaying: (playing) => set({ presentationPlaying: playing }),
}));

export { STEP_TIMES };
