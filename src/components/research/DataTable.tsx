import { useMemo, useState } from 'react';
import type { ExperimentRun } from '../../types/experiment';
import { downloadCsv, downloadJson } from '../../utils/exportData';

const COLUMNS: { key: keyof ExperimentRun['samples'][number]; label: string }[] = [
  { key: 't', label: 't' },
  { key: 'timeToSingularity', label: 'T − t' },
  { key: 'maxVelocity', label: '|u|მაქს' },
  { key: 'meanVelocity', label: '|u|საშ' },
  { key: 'maxVorticity', label: 'ვორტიციტეტი' },
  { key: 'coreRadius', label: 'ბირთვის რადიუსი' },
  { key: 'stretchFactor', label: 'ღერძული გაწელვა' },
  { key: 'kineticEnergyIndex', label: 'ენერგიის ინდექსი' },
];

const PAGE_SIZE = 40;

function fmt(v: unknown, digits: number): string {
  if (typeof v !== 'number' || !isFinite(v)) return '—';
  return v.toFixed(digits);
}

interface Props {
  run: ExperimentRun | null;
}

export function DataTable({ run }: Props) {
  const [sortKey, setSortKey] = useState<keyof ExperimentRun['samples'][number]>('t');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [precision, setPrecision] = useState(4);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');

  const sorted = useMemo(() => {
    if (!run) return [];
    const rows = [...run.samples];
    rows.sort((a, b) => (Number(a[sortKey]) - Number(b[sortKey])) * sortDir);
    return rows;
  }, [run, sortKey, sortDir]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sorted;
    const q = parseFloat(filter);
    if (isNaN(q)) return sorted;
    return sorted.filter((r) => Math.abs(r.t - q) < 0.05);
  }, [sorted, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  if (!run) {
    return <p className="section-sub">ჯერ არ არის გაშვებული ექსპერიმენტი — დააჭირეთ „ექსპერიმენტის გაშვება“-ს ზემოთ.</p>;
  }

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  return (
    <div>
      <div className="data-table-toolbar">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
          {run.metadata.name} · {run.samples.length} ნიმუში
        </span>
        <div className="sampling-field">
          <label>ციფრების სიზუსტე</label>
          <select value={precision} onChange={(e) => setPrecision(parseInt(e.target.value, 10))}>
            {[3, 5, 8].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sampling-field">
          <label>ძებნა (t ≈)</label>
          <input
            type="number"
            step={0.01}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            style={{ width: 90 }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => downloadCsv(run)}>
          CSV
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => downloadJson(run)}>
          JSON
        </button>
      </div>

      <div className="data-table-wrap">
        <table className="research-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)}>
                  {c.label}
                  {sortKey === c.key ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i}>
                {COLUMNS.map((c) => (
                  <td key={c.key}>{fmt(row[c.key], precision)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
        <button className="btn btn-ghost btn-sm" disabled={clampedPage === 0} onClick={() => setPage((p) => p - 1)}>
          წინა გვერდი
        </button>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
          გვერდი {clampedPage + 1} / {pageCount}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={clampedPage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
          შემდეგი გვერდი
        </button>
      </div>
    </div>
  );
}
