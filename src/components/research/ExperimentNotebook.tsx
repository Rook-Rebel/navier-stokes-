import { useEffect, useState } from 'react';
import { useExperimentStore } from '../../hooks/useExperimentStore';
import type { ExperimentRun } from '../../types/experiment';

/** "კვლევის ჩანაწერები" — a short note attached to a saved experiment, persisted with it and optionally shown in the generated report. */
export function ExperimentNotebook({ run }: { run: ExperimentRun }) {
  const savedRun = useExperimentStore((s) => s.runs.find((r) => r.metadata.id === run.metadata.id));
  const setNote = useExperimentStore((s) => s.setNote);
  const [draft, setDraft] = useState(savedRun?.metadata.note ?? run.metadata.note ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(savedRun?.metadata.note ?? run.metadata.note ?? '');
  }, [run.metadata.id, savedRun?.metadata.note, run.metadata.note]);

  if (!savedRun) {
    return (
      <p className="section-sub" style={{ marginBottom: 14 }}>
        ჩანაწერების დასამატებლად ჯერ შეინახეთ ეს ექსპერიმენტი „ექსპერიმენტის შენახვა“-თი.
      </p>
    );
  }

  return (
    <div className="side-panel-block" style={{ marginBottom: 16 }}>
      <div className="side-panel-title">
        <span>კვლევის ჩანაწერები</span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setSaved(false);
        }}
        placeholder="მაგ. „ν-ის გაზრდისას ბირთვის კონცენტრაცია უფრო ნელა ვითარდება.“"
        rows={3}
        style={{
          width: '100%',
          background: 'var(--bg-panel-raised)',
          border: '1px solid var(--border-soft)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontSize: '0.84rem',
          padding: 8,
          resize: 'vertical',
        }}
      />
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 8 }}
        onClick={() => {
          setNote(run.metadata.id, draft);
          setSaved(true);
        }}
      >
        {saved ? 'შენახულია ✓' : 'ჩანაწერის შენახვა'}
      </button>
    </div>
  );
}
