import { DEFAULT_PARAMS, MAX_SIM_TIME, type SimParams } from '../utils/flowField';
import type { SamplingConfig } from '../types/experiment';

export interface ExperimentPreset {
  id: string;
  label: string;
  description: string;
  params: SimParams;
  /** Suggested sampling window for this preset; the user can still change it freely. */
  sampling: Pick<SamplingConfig, 'startT' | 'endT'>;
}

const FULL_RANGE = { startT: 0, endT: MAX_SIM_TIME };

export const EXPERIMENT_PRESETS: ExperimentPreset[] = [
  {
    id: 'baseline',
    label: 'საწყისი რეჟიმი',
    description: 'ნაგულისხმევი პარამეტრები — საბაზისო წერტილი შედარებისთვის.',
    params: { ...DEFAULT_PARAMS },
    sampling: FULL_RANGE,
  },
  {
    id: 'weak-compression',
    label: 'სუსტი შეკუმშვა',
    description: 'რადიალური შეკუმშვა შემცირებულია — მორევი ნელა იკუმშება.',
    params: { ...DEFAULT_PARAMS, radialCompression: 0.2, axialStretch: 0.2 },
    sampling: FULL_RANGE,
  },
  {
    id: 'strong-compression',
    label: 'ძლიერი შეკუმშვა',
    description: 'რადიალური შეკუმშვა მაქსიმალურთან ახლოა — ბირთვი სწრაფად ვიწროვდება.',
    params: { ...DEFAULT_PARAMS, radialCompression: 1.4 },
    sampling: FULL_RANGE,
  },
  {
    id: 'strong-stretch',
    label: 'ძლიერი ღერძული გაწელვა',
    description: 'ღერძული გაწელვის კოეფიციენტი მაღალია — სტრუქტურა მკვეთრად წაგრძელდება.',
    params: { ...DEFAULT_PARAMS, axialStretch: 1.4 },
    sampling: FULL_RANGE,
  },
  {
    id: 'high-viscosity',
    label: 'მაღალი სიბლანტე',
    description: 'სიბლანტე ν მაღალია — ყველა ზრდის სიჩქარე შენელებულია.',
    params: { ...DEFAULT_PARAMS, viscosity: 0.95 },
    sampling: FULL_RANGE,
  },
  {
    id: 'low-viscosity',
    label: 'დაბალი სიბლანტე',
    description: 'სიბლანტე ν მინიმალურთან ახლოა — კონცენტრაცია ყველაზე სწრაფად ვითარდება.',
    params: { ...DEFAULT_PARAMS, viscosity: 0.04 },
    sampling: FULL_RANGE,
  },
  {
    id: 'near-critical',
    label: 'კრიტიკულ დროსთან ახლოს',
    description: 'ნაგულისხმევი პარამეტრები, ნიმუშები აღებულია მხოლოდ t = 0.9-დან T-მდე ინტერვალში.',
    params: { ...DEFAULT_PARAMS },
    sampling: { startT: 0.9, endT: MAX_SIM_TIME },
  },
];

export const CUSTOM_PRESET_ID = 'custom';
