import { useState } from 'react';
import { Term } from '../common/Term';

const W = 320;
const H = 220;
const BASE_AREA = 46; // amplitude * width = constant, by construction

function buildBumpPath(amplitude: number, width: number): string {
  const cx = W / 2;
  const baseY = H - 18;
  const steps = 60;
  let d = `M ${cx - 140} ${baseY}`;
  for (let i = 0; i <= steps; i++) {
    const x = -140 + (i / steps) * 280;
    const y = -amplitude * Math.exp(-(x * x) / (2 * width * width));
    d += ` L ${(cx + x).toFixed(1)} ${(baseY + y).toFixed(1)}`;
  }
  d += ` L ${cx + 140} ${baseY} Z`;
  return d;
}

export function EnergyExplanation() {
  const [k, setK] = useState(0.15);
  const width = 6 + (1 - k) * 42;
  const amplitude = BASE_AREA / width;

  return (
    <section className="section" id="energy-explanation">
      <span className="eyebrow-label">კონცეპტუალური ანალოგია</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        როგორ შეიძლება სიჩქარე გაიზარდოს, მაგრამ ენერგია სასრული დარჩეს?
      </h2>
      <p className="section-sub">
        <Term id="kineticEnergy" />-ის შეფასება დამოკიდებულია სივრცის მთელ არეზე ინტეგრირებაზე, არა მხოლოდ ერთ წერტილში მიღწეულ მაქსიმუმზე. ქვემოთ მოცემული ინტერაქტიული მაგალითი ასახავს მხოლოდ ამ ზოგად პრინციპს — ის არ არის თავად მტკიცების ნაწილი.
      </p>

      <div className="glass-panel" style={{ padding: 28, marginTop: 20 }}>
        <div className="energy-analogy-wrap">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="სიმაღლისა და სიგანის ინტერაქტიული ანალოგია">
            <line x1={20} y1={H - 18} x2={W - 20} y2={H - 18} stroke="var(--border-soft)" strokeWidth={1} />
            <path d={buildBumpPath(amplitude, width)} fill="url(#energyGrad)" stroke="var(--accent-primary)" strokeWidth={1.5} />
            <defs>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--amber-fast)" stopOpacity={0.75} />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.12} />
              </linearGradient>
            </defs>
          </svg>

          <div>
            <div className="param-slider">
              <div className="param-slider-head">
                <span className="param-slider-label">დრო (აბსტრაქტული მაგალითი)</span>
                <span className="param-slider-value mono">{(k * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.97}
                step={0.01}
                value={k}
                onChange={(e) => setK(parseFloat(e.target.value))}
                aria-label="დროის გადაადგილება ანალოგიაში"
                style={{ ['--pct' as string]: `${(k / 0.97) * 100}%` }}
              />
            </div>
            <div className="floating-data-row">
              <span>ლოკალური მნიშვნელობა</span>
              <b>{amplitude.toFixed(2)}</b>
            </div>
            <div className="floating-data-row">
              <span>სივრცული მოცულობა</span>
              <b>{width.toFixed(2)}</b>
            </div>
            <div className="floating-data-row">
              <span>„ენერგიის“ ინდექსი (მნიშვნელობა × მოცულობა)</span>
              <b>{(amplitude * width).toFixed(2)}</b>
            </div>
          </div>
        </div>
        <p className="energy-caption">
          სიდიდის ზრდა და მისი მოქმედების რეგიონის შემცირება ერთდროულად ხდება.
          <br />
          „ძალიან დიდი მნიშვნელობა ძალიან მცირე რეგიონში ავტომატურად არ ნიშნავს უსასრულო მთლიან ენერგიას.“
        </p>
      </div>
    </section>
  );
}
