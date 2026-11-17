import { useSimStore } from '../../hooks/useSimStore';
import { computeExtendedDiagnostics, CRITICAL_TIME } from '../../utils/flowField';

function fmt(v: number, digits = 4): string {
  if (!isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toFixed(1);
  if (Math.abs(v) >= 100) return v.toFixed(2);
  return v.toFixed(digits);
}

const ROWS: { key: keyof ReturnType<typeof computeExtendedDiagnostics>; label: string }[] = [
  { key: 't', label: 'დრო t' },
  { key: 'timeToSingularity', label: 'T − t' },
  { key: 'maxVelocity', label: 'მაქს. სიჩქარის მოდული' },
  { key: 'meanVelocity', label: 'საშ. სიჩქარის მოდული' },
  { key: 'vorticityIndex', label: 'მაქს. ვორტიციტეტის პროქსი' },
  { key: 'meanVorticity', label: 'საშ. ვორტიციტეტის პროქსი' },
  { key: 'radialScale', label: 'ბირთვის რადიუსი' },
  { key: 'compressionFactor', label: 'შეკუმშვის კოეფიციენტი' },
  { key: 'stretchFactorVisual', label: 'გაწელვის კოეფიციენტი' },
  { key: 'kineticEnergyIndex', label: 'ენერგიის ინდექსი' },
  { key: 'viscosity', label: 'სიბლანტე ν' },
];

/** Full research-grade diagnostics readout — the RIGHT panel of Research Mode. Every value comes straight from computeExtendedDiagnostics(t, params); nothing here is randomized. */
export function DiagnosticsPanel() {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const d = computeExtendedDiagnostics(t, params);

  return (
    <div className="side-panel-block research-diagnostics">
      <div className="side-panel-title">
        <span>დიაგნოსტიკა</span>
      </div>
      <table className="diagnostics-table">
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td className="mono">{fmt(d[r.key] as number)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.visualizationClamped && (
        <p className="research-clamp-note">
          ⚠ ღერძული გაწელვის ვიზუალიზაცია ამ მომენტში დარბილებულია ეკრანზე ჩვენებისთვის (raw მნიშვნელობა ={' '}
          {fmt(d.stretchFactorRaw, 1)}) — CSV/JSON ექსპორტი ორივე მნიშვნელობას შეიცავს.
        </p>
      )}
      <p className="research-diagnostics-footnote">
        T = {CRITICAL_TIME.toFixed(3)} · მოდელის ვერსია იხილეთ ტექნიკურ ინფორმაციაში.
      </p>
    </div>
  );
}
