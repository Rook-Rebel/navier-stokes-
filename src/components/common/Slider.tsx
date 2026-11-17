import { InfoTip } from './InfoTip';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tooltip?: string;
  displayValue?: string;
  unit?: string;
  ariaLabel?: string;
}

export function Slider({ label, value, min, max, step, onChange, tooltip, displayValue, unit, ariaLabel }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="param-slider">
      <div className="param-slider-head">
        <span className="param-slider-label">
          {label}
          {tooltip && <InfoTip text={tooltip} />}
        </span>
        <span className="param-slider-value mono">
          {displayValue ?? value.toFixed(2)}
          {unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel ?? label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </div>
  );
}
