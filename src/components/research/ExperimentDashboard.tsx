import { useExperimentStore } from '../../hooks/useExperimentStore';
import type { ExperimentRun } from '../../types/experiment';

interface Props {
  onOpen: (run: ExperimentRun) => void;
  onCompare: (id: string) => void;
  onReport: (run: ExperimentRun) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ka-GE', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** "ჩემი ექსპერიმენტები" — compact rows over cards, per the design-refinement direction. */
export function ExperimentDashboard({ onOpen, onCompare, onReport }: Props) {
  const runs = useExperimentStore((s) => s.runs);
  const removeRun = useExperimentStore((s) => s.removeRun);

  if (runs.length === 0) {
    return (
      <p className="section-sub">
        ჯერ არ გაქვთ შენახული ექსპერიმენტი. გაუშვით ერთი „ექსპერიმენტის გაშვება“-თი და შემდეგ დააჭირეთ „ექსპერიმენტის შენახვა“-ს.
      </p>
    );
  }

  const handleDelete = (run: ExperimentRun) => {
    if (window.confirm(`წავშალო ექსპერიმენტი „${run.metadata.name}“? ეს ქმედება შეუქცევადია.`)) {
      removeRun(run.metadata.id);
    }
  };

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>სახელი</th>
            <th>თარიღი</th>
            <th>ν</th>
            <th>შეკუმშვა</th>
            <th>გაწელვა</th>
            <th>მაქს. სიჩქარე</th>
            <th>მაქს. ვორტიციტეტი</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const last = run.samples[run.samples.length - 1];
            return (
              <tr key={run.metadata.id}>
                <td style={{ color: 'var(--text-primary)' }}>{run.metadata.name}</td>
                <td>{formatDate(run.metadata.createdAt)}</td>
                <td className="mono">{run.metadata.params.viscosity.toFixed(3)}</td>
                <td className="mono">{run.metadata.params.radialCompression.toFixed(3)}</td>
                <td className="mono">{run.metadata.params.axialStretch.toFixed(3)}</td>
                <td className="mono">{last ? last.maxVelocity.toFixed(3) : '—'}</td>
                <td className="mono">{last ? last.maxVorticity.toFixed(3) : '—'}</td>
                <td>
                  <div className="dashboard-row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onOpen(run)}>
                      გახსნა
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onCompare(run.metadata.id)}>
                      შედარება
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onReport(run)}>
                      რეპორტი
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(run)}>
                      წაშლა
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
