import { useState } from 'react';
import { useSimStore } from '../../hooks/useSimStore';
import { MAX_SIM_TIME } from '../../utils/flowField';
import { EXPERIMENT_PRESETS, CUSTOM_PRESET_ID } from '../../data/experimentPresets';
import { encodeExperimentCode, decodeExperimentCode } from '../../utils/experimentCode';
import type { SamplingConfig } from '../../types/experiment';

interface Props {
  experimentName: string;
  onNameChange: (name: string) => void;
  presetId: string;
  onPresetChange: (id: string) => void;
  sampling: SamplingConfig;
  onSamplingChange: (s: SamplingConfig) => void;
  onRun: () => void;
  onSave: () => void;
  hasActiveRun: boolean;
  saveMessage: string | null;
}

const TIME_STEPS = [0.01, 0.005, 0.001];
const SAMPLE_COUNTS = [100, 250, 500, 1000];

export function ExperimentTopBar({
  experimentName,
  onNameChange,
  presetId,
  onPresetChange,
  sampling,
  onSamplingChange,
  onRun,
  onSave,
  hasActiveRun,
  saveMessage,
}: Props) {
  const params = useSimStore((s) => s.params);
  const setParam = useSimStore((s) => s.setParam);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);

  const applyPreset = (id: string) => {
    onPresetChange(id);
    const preset = EXPERIMENT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    (Object.keys(preset.params) as (keyof typeof preset.params)[]).forEach((k) => {
      setParam(k, preset.params[k]);
    });
    onSamplingChange({ ...sampling, startT: preset.sampling.startT, endT: preset.sampling.endT });
  };

  const handleNewExperiment = () => {
    onNameChange(`ექსპერიმენტი — ${new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}`);
    onPresetChange(CUSTOM_PRESET_ID);
  };

  const copyCode = async () => {
    const code = encodeExperimentCode(params);
    try {
      await navigator.clipboard.writeText(code);
      setCopyOk(true);
      window.setTimeout(() => setCopyOk(false), 1800);
    } catch {
      setCodeDraft(code);
    }
  };

  const loadCode = () => {
    const result = decodeExperimentCode(codeDraft);
    if (!result.ok || !result.params) {
      setCodeError(result.error ?? 'უცნობი შეცდომა.');
      return;
    }
    (Object.keys(result.params) as (keyof typeof result.params)[]).forEach((k) => {
      setParam(k, result.params![k]);
    });
    setCodeError(null);
    onPresetChange(CUSTOM_PRESET_ID);
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={handleNewExperiment}>
        ახალი ექსპერიმენტი
      </button>

      <input
        className="experiment-name-input"
        value={experimentName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="ექსპერიმენტის სახელი, მაგ. „ძლიერი შეკუმშვა — ექსპერიმენტი 01“"
        aria-label="ექსპერიმენტის სახელი"
      />

      <select
        className="experiment-name-input"
        style={{ minWidth: 170 }}
        value={presetId}
        onChange={(e) => applyPreset(e.target.value)}
        aria-label="ექსპერიმენტის პრესეტი"
      >
        <option value={CUSTOM_PRESET_ID}>საკუთარი პარამეტრები</option>
        {EXPERIMENT_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="sampling-field">
        <label>ნიმუშის რეჟიმი</label>
        <select
          value={sampling.mode}
          onChange={(e) => onSamplingChange({ ...sampling, mode: e.target.value as SamplingConfig['mode'] })}
        >
          <option value="sampleCount">ნიმუშების რაოდენობა</option>
          <option value="timeStep">დროითი ნაბიჯი</option>
        </select>
      </div>

      {sampling.mode === 'timeStep' ? (
        <div className="sampling-field">
          <label>დროითი ნაბიჯი</label>
          <select
            value={sampling.timeStep}
            onChange={(e) => onSamplingChange({ ...sampling, timeStep: parseFloat(e.target.value) })}
          >
            {TIME_STEPS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="sampling-field">
          <label>ნიმუშების რაოდენობა</label>
          <select
            value={sampling.sampleCount}
            onChange={(e) => onSamplingChange({ ...sampling, sampleCount: parseInt(e.target.value, 10) })}
          >
            {SAMPLE_COUNTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sampling-field">
        <label>t დასაწყისი</label>
        <input
          type="number"
          min={0}
          max={MAX_SIM_TIME}
          step={0.01}
          value={sampling.startT}
          onChange={(e) => onSamplingChange({ ...sampling, startT: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="sampling-field">
        <label>t დასასრული</label>
        <input
          type="number"
          min={0}
          max={MAX_SIM_TIME}
          step={0.01}
          value={sampling.endT}
          onChange={(e) => onSamplingChange({ ...sampling, endT: parseFloat(e.target.value) || MAX_SIM_TIME })}
        />
      </div>

      <button className="btn btn-primary btn-sm" onClick={onRun}>
        ექსპერიმენტის გაშვება
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onSave} disabled={!hasActiveRun}>
        ექსპერიმენტის შენახვა
      </button>
      {saveMessage && <span className="experiment-active-badge">{saveMessage}</span>}

      <div className="research-top-spacer" />

      <button className="btn btn-ghost btn-sm" onClick={() => setCodeOpen((v) => !v)}>
        ექსპერიმენტის კოდი
      </button>

      {codeOpen && (
        <div className="glass-panel" style={{ position: 'absolute', top: 60, right: 20, zIndex: 40, padding: 14, width: 340 }}>
          <div className="side-panel-title">
            <span>რეპროდუცირების კოდი</span>
          </div>
          <textarea
            value={codeDraft || encodeExperimentCode(params)}
            onChange={(e) => setCodeDraft(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg-panel-raised)',
              border: '1px solid var(--border-soft)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: 8,
              resize: 'vertical',
            }}
          />
          {codeError && <p style={{ color: 'var(--accent-danger)', fontSize: '0.74rem', marginTop: 6 }}>{codeError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={copyCode}>
              {copyOk ? 'დაკოპირდა ✓' : 'კოდის კოპირება'}
            </button>
            <button className="btn btn-sm" onClick={loadCode}>
              კოდის ჩატვირთვა
            </button>
          </div>
        </div>
      )}
    </>
  );
}
