import { useSimStore, type QualityLevel } from '../../hooks/useSimStore';

const LEVELS: { id: QualityLevel; label: string }[] = [
  { id: 'low', label: 'დაბალი' },
  { id: 'medium', label: 'საშუალო' },
  { id: 'high', label: 'მაღალი' },
];

export function QualityControl() {
  const quality = useSimStore((s) => s.quality);
  const setQuality = useSimStore((s) => s.setQuality);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>ხარისხი</span>
      </div>
      <div className="quality-row" role="group" aria-label="ვიზუალიზაციის ხარისხის დონე">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={`btn btn-sm${quality === l.id ? ' active' : ''}`}
            onClick={() => setQuality(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
