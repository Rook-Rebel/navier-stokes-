import type { CameraPreset } from '../hooks/useSimStore';

export interface GuidedStep {
  id: string;
  number: string;
  title: string;
  text: string;
  t: number;
  cameraPreset: CameraPreset;
}

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 'smooth',
    number: '01',
    title: 'გლუვი საწყისი მდგომარეობა',
    text: 'დინება იწყება გლუვად და სისტემაში ჯერ არ არის სინგულარობა.',
    t: 0.02,
    cameraPreset: 'full',
  },
  {
    id: 'vortex',
    number: '02',
    title: 'მორევის ფორმირება',
    text: 'ნაწილაკები იწყებენ ღერძის გარშემო ბრუნვას და ჩნდება გამოკვეთილი მორევითი სტრუქტურა.',
    t: 0.32,
    cameraPreset: 'side',
  },
  {
    id: 'compression',
    number: '03',
    title: 'რადიალური შეკუმშვა',
    text: 'მორევის ცენტრალური რეგიონი ვიწროვდება და ტრაექტორიები შიგნით სპირალურად მიემართება.',
    t: 0.62,
    cameraPreset: 'top',
  },
  {
    id: 'stretching',
    number: '04',
    title: 'ღერძული გაწელვა',
    text: 'ამავე დროს სტრუქტურა ღერძის გასწვრივ იწელება და ადგილობრივი მოძრაობა ძლიერდება.',
    t: 0.83,
    cameraPreset: 'trajectory',
  },
  {
    id: 'approach',
    number: '05',
    title: 'სინგულარობასთან მიახლოება',
    text: 'სიჩქარის მაქსიმალური მნიშვნელობა სწრაფად იზრდება, მაშინ როცა მოდელის გლობალური ენერგიის ინდექსი სასრულად რჩება.',
    t: 0.965,
    cameraPreset: 'core',
  },
];
