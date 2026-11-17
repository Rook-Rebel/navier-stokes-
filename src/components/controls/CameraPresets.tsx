import { useSimStore, type CameraPreset } from '../../hooks/useSimStore';

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'full', label: 'სრული ხედი' },
  { id: 'top', label: 'ზემოდან' },
  { id: 'side', label: 'გვერდიდან' },
  { id: 'core', label: 'ბირთვთან' },
  { id: 'trajectory', label: 'ტრაექტორიების ხედი' },
  { id: 'inside', label: 'მორევის შიგნით' },
];

export function CameraPresets() {
  const requestCameraPreset = useSimStore((s) => s.requestCameraPreset);
  const autoCamera = useSimStore((s) => s.autoCamera);
  const toggleAutoCamera = useSimStore((s) => s.toggleAutoCamera);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>კამერის რაკურსი</span>
      </div>
      <div className="camera-preset-row">
        {PRESETS.map((p) => (
          <button key={p.id} className="btn btn-ghost btn-sm" onClick={() => requestCameraPreset(p.id)}>
            {p.label}
          </button>
        ))}
        <button
          className={`btn btn-sm${autoCamera ? ' active' : ''}`}
          onClick={toggleAutoCamera}
          aria-pressed={autoCamera}
        >
          ავტომატური კამერა
        </button>
      </div>
    </div>
  );
}
