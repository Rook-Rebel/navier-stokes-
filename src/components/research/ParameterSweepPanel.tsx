import { useMemo, useState } from 'react';
import { useSimStore } from '../../hooks/useSimStore';
import { computeExtendedDiagnostics, MAX_SIM_TIME, PARAM_RANGES, type SimParams } from '../../utils/flowField';
import { ResearchChart } from './ResearchChart';

const SWEEP_PARAMS: { key: keyof typeof PARAM_RANGES; label: string }[] = [
  { key: 'viscosity', label: 'სიბლანტე ν' },
  { key: 'radialCompression', label: 'რადიალური შეკუმშვა' },
  { key: 'axialStretch', label: 'ღერძული გაწელვა' },
  { key: 'rotationIntensity', label: 'ბრუნვის ინტენსივობა' },
];

type YKey = 'maxVelocity' | 'vorticityIndex' | 'radialScale' | 'kineticEnergyIndex' | 'stretchFactorVisual';

const Y_OPTIONS: { key: YKey; label: string }[] = [
  { key: 'vorticityIndex', label: 'მაქსიმალური ვორტიციტეტი' },
  { key: 'maxVelocity', label: 'მაქსიმალური სიჩქარე' },
  { key: 'radialScale', label: 'ბირთვის რადიუსი' },
  { key: 'stretchFactorVisual', label: 'გაწელვის კოეფიციენტი' },
  { key: 'kineticEnergyIndex', label: 'ენერგიის ინდექსი' },
];

/** "პარამეტრების სკანირება" — sweeps one parameter across a range and evaluates real model diagnostics at each value; nothing here is randomized or approximated beyond the model itself. */
export function ParameterSweepPanel() {
  const baseParams = useSimStore((s) => s.params);
  const [paramKey, setParamKey] = useState<keyof typeof PARAM_RANGES>('viscosity');
  const range = PARAM_RANGES[paramKey];
  const [min, setMin] = useState(range.min);
  const [max, setMax] = useState(range.max);
  const [samples, setSamples] = useState(20);
  const [evalT, setEvalT] = useState(MAX_SIM_TIME);
  const [yKey, setYKey] = useState<YKey>('vorticityIndex');

  const handleParamChange = (key: keyof typeof PARAM_RANGES) => {
    setParamKey(key);
    setMin(PARAM_RANGES[key].min);
    setMax(PARAM_RANGES[key].max);
  };

  const points = useMemo(() => {
    const n = Math.max(2, Math.min(200, Math.round(samples)));
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const value = min + ((max - min) * i) / (n - 1);
      const p: SimParams = { ...baseParams, [paramKey]: value };
      const d = computeExtendedDiagnostics(evalT, p);
      out.push({ x: value, y: d[yKey] });
    }
    return out;
  }, [baseParams, paramKey, min, max, samples, evalT, yKey]);

  const xLabelText = SWEEP_PARAMS.find((p) => p.key === paramKey)?.label ?? paramKey;
  const yLabelText = Y_OPTIONS.find((y) => y.key === yKey)?.label ?? yKey;

  return (
    <div>
      <p className="section-sub" style={{ marginBottom: 16 }}>
        ირჩევთ ერთ პარამეტრს და დიაპაზონს — მოდელი გამოთვლის რჩეულ დიაგნოსტიკურ სიდიდეს დროის მომენტში t = {evalT.toFixed(3)}-სთვის, ყველა დანარჩენი პარამეტრი უცვლელი რჩება მიმდინარე მნიშვნელობებზე.
      </p>
      <div className="sweep-config-row">
        <div className="sampling-field">
          <label>პარამეტრი</label>
          <select value={paramKey} onChange={(e) => handleParamChange(e.target.value as keyof typeof PARAM_RANGES)}>
            {SWEEP_PARAMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sampling-field">
          <label>მინიმუმი</label>
          <input type="number" value={min} step={0.01} onChange={(e) => setMin(parseFloat(e.target.value))} />
        </div>
        <div className="sampling-field">
          <label>მაქსიმუმი</label>
          <input type="number" value={max} step={0.01} onChange={(e) => setMax(parseFloat(e.target.value))} />
        </div>
        <div className="sampling-field">
          <label>ნიმუშების რაოდენობა</label>
          <input type="number" value={samples} min={2} max={200} onChange={(e) => setSamples(parseInt(e.target.value, 10) || 2)} />
        </div>
        <div className="sampling-field">
          <label>შეფასების t</label>
          <input
            type="number"
            value={evalT}
            min={0}
            max={MAX_SIM_TIME}
            step={0.001}
            onChange={(e) => setEvalT(Math.min(Math.max(parseFloat(e.target.value) || 0, 0), MAX_SIM_TIME))}
          />
        </div>
        <div className="sampling-field">
          <label>y დიაგნოსტიკა</label>
          <select value={yKey} onChange={(e) => setYKey(e.target.value as YKey)}>
            {Y_OPTIONS.map((y) => (
              <option key={y.key} value={y.key}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResearchChart
        series={[{ label: yLabelText, color: 'var(--accent-primary)', points }]}
        xLabel={xLabelText}
        yLabel={yLabelText}
      />
    </div>
  );
}
