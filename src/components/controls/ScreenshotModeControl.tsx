import { useState } from 'react';
import { useSimStore } from '../../hooks/useSimStore';
import { composeSceneImage, downloadBlob, type ImageOverlayOptions, type ImageResolution } from '../../utils/exportImage';

export type ScreenshotFrame = '16:9' | '1:1' | '9:16' | null;

const PRESETS: { id: Exclude<ScreenshotFrame, null>; label: string }[] = [
  { id: '16:9', label: '16:9 პრეზენტაცია' },
  { id: '1:1', label: '1:1 პოსტი' },
  { id: '9:16', label: '9:16 სთორი' },
];

const RESOLUTIONS: ImageResolution[] = ['1920x1080', '2560x1440', '3840x2160'];

const OVERLAY_LABELS: { key: keyof ImageOverlayOptions; label: string }[] = [
  { key: 'title', label: 'სათაური' },
  { key: 'time', label: 'დრო' },
  { key: 'params', label: 'პარამეტრები' },
  { key: 'legend', label: 'ლეგენდა' },
  { key: 'disclaimer', label: 'დისკლეიმერი' },
];

const MODE_LABELS: Record<string, string> = {
  particles: 'ნაწილაკები',
  trajectories: 'ტრაექტორიები',
  velocity: 'სიჩქარის ველი',
  vorticity: 'ვორტიციტეტი',
  energy: 'ენერგია',
  comparison: 'შედარება',
};

interface Props {
  frame: ScreenshotFrame;
  onChange: (frame: ScreenshotFrame) => void;
}

/** "კადრის მომზადება" — reframes the viewport to a clean aspect ratio, hides chrome, and can export an actual composited PNG. */
export function ScreenshotModeControl({ frame, onChange }: Props) {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const mode = useSimStore((s) => s.mode);
  const [resolution, setResolution] = useState<ImageResolution>('1920x1080');
  const [overlays, setOverlays] = useState<ImageOverlayOptions>({
    title: true,
    time: true,
    params: false,
    legend: true,
    disclaimer: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOverlay = (key: keyof ImageOverlayOptions) => setOverlays((o) => ({ ...o, [key]: !o[key] }));

  const handleExport = async () => {
    setError(null);
    setBusy(true);
    try {
      const canvas = document.querySelector<HTMLCanvasElement>('.lab-canvas-wrap canvas');
      if (!canvas) throw new Error('canvas-not-found');
      const blob = await composeSceneImage(canvas, resolution, frame ?? '16:9', overlays, { t, params, mode: MODE_LABELS[mode] ?? mode });
      downloadBlob(`navier-stokes-${mode}-${resolution}.png`, blob);
    } catch {
      setError('PNG-ის შექმნა ვერ მოხერხდა — სცადეთ თავიდან ან შეამცირეთ გარჩევადობა.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>კადრის მომზადება</span>
      </div>
      <div className="camera-preset-row">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`btn btn-ghost btn-sm${frame === p.id ? ' active' : ''}`}
            onClick={() => onChange(frame === p.id ? null : p.id)}
          >
            {p.label}
          </button>
        ))}
        {frame && (
          <button className="btn btn-sm" onClick={() => onChange(null)}>
            გამორთვა
          </button>
        )}
      </div>

      <div className="sampling-field" style={{ marginTop: 12 }}>
        <label>გარჩევადობა</label>
        <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)}>
          {RESOLUTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        {OVERLAY_LABELS.map((o) => (
          <label className="check-row" key={o.key}>
            <input type="checkbox" checked={overlays[o.key]} onChange={() => toggleOverlay(o.key)} />
            {o.label}
          </label>
        ))}
      </div>

      {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.76rem', marginTop: 8 }}>{error}</p>}

      <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={handleExport} disabled={busy}>
        {busy ? 'მუშავდება…' : 'PNG-ის ჩამოტვირთვა'}
      </button>
    </div>
  );
}
