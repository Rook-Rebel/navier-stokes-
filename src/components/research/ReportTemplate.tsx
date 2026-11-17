import { forwardRef } from 'react';
import type { ExperimentRun } from '../../types/experiment';
import { MODEL_ASSUMPTIONS_EN } from '../../utils/exportData';
import { SOURCES } from '../../data/sources';
import { MODEL_VERSION } from '../../utils/flowField';

export interface ReportConfig {
  includeScreenshot: boolean;
  includeParamsTable: boolean;
  includeVelocityChart: boolean;
  includeVorticityChart: boolean;
  includeEnergyChart: boolean;
  includeDataSummary: boolean;
  includeSources: boolean;
  includeMethodology: boolean;
}

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  includeScreenshot: true,
  includeParamsTable: true,
  includeVelocityChart: true,
  includeVorticityChart: true,
  includeEnergyChart: true,
  includeDataSummary: true,
  includeSources: true,
  includeMethodology: true,
};

function miniLineChart(points: { x: number; y: number }[], color: string, width = 700, height = 180): string {
  if (points.length < 2) return '';
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys, yMin + 1e-9);
  const pad = 8;
  const path = points
    .map((p, i) => {
      const x = pad + ((p.x - xMin) / (xMax - xMin || 1)) * (width - pad * 2);
      const y = height - pad - ((p.y - yMin) / (yMax - yMin || 1)) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" /></svg>`;
}

const PARAM_ROWS: { key: keyof ExperimentRun['metadata']['params']; label: string }[] = [
  { key: 'viscosity', label: 'სიბლანტე ν' },
  { key: 'radialCompression', label: 'რადიალური შეკუმშვა' },
  { key: 'axialStretch', label: 'ღერძული გაწელვა' },
  { key: 'rotationIntensity', label: 'ბრუნვის ინტენსივობა' },
  { key: 'forcingInfluence', label: 'გარე ძალის გავლენა' },
];

interface Props {
  run: ExperimentRun;
  config: ReportConfig;
  screenshotDataUrl: string | null;
}

/**
 * Rendered off-screen (never shown to the user directly) using the app's
 * real Georgian webfonts, then rasterized page-by-page for the PDF. This
 * guarantees correct Georgian glyph rendering regardless of whether a PDF
 * library can embed the custom OTF outlines directly.
 */
export const ReportTemplate = forwardRef<HTMLDivElement, Props>(function ReportTemplate({ run, config, screenshotDataUrl }, ref) {
  const last = run.samples[run.samples.length - 1];
  const first = run.samples[0];

  return (
    <div ref={ref} className="report-doc">
      <div className="report-header">
        <span className="report-kicker">მილენიუმის პრობლემა • 2026 · მოდელის ვერსია {MODEL_VERSION}</span>
        <h1 className="report-title">ნავიე-სტოქსის სინგულარობის ინტერაქტიული მოდელის კვლევა</h1>
        <p className="report-experiment-name">{run.metadata.name}</p>
        <p className="report-date">{new Date(run.generatedAt).toLocaleString('ka-GE', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>

      <div className="report-notice">
        <strong>მნიშვნელოვანი შენიშვნა:</strong> ეს ექსპერიმენტი ეფუძნება სასწავლო, დივერგენციისგან თავისუფალ მოდელს და არ წარმოადგენს 2026 წლის მტკიცების სრულ რიცხვით რეპროდუქციას ან დამოუკიდებელ დადასტურებას.
      </div>

      <h2 className="report-section-title">1. კვლევის მიზანი</h2>
      <p className="report-body">
        ამ ექსპერიმენტის მიზანია, გამოკვლეულ იქნას, თუ როგორ რეაგირებს ნავიე-სტოქსის სასწავლო, დივერგენციისგან თავისუფალი მოდელი მოცემულ პარამეტრებზე დროის მონაკვეთში{' '}
        t = {first.t.toFixed(4)}-დან t = {last.t.toFixed(4)}-მდე, კონკრეტულად კი — როგორ იცვლება მაქსიმალური სიჩქარე, ვორტიციტეტის პროქსი და ენერგიის ინდექსი სინგულარობასთან მიახლოებისას.
      </p>

      {config.includeMethodology && (
        <>
          <h2 className="report-section-title">2. მოდელის აღწერა</h2>
          <p className="report-body">
            მოდელი აგებულია ცილინდრულ კოორდინატებში (r, θ, z), როგორც ორი ზუსტად დივერგენციისგან თავისუფალი წრფივი დაძაბვის ველის ჯამი პლუს Burgers/Lamb-Oseen ტიპის ბრუნვითი პროფილი. დროში ევოლუცია გამოთვლილია ზუსტი დახურული ფორმულით (არა რიცხვითი ნაბიჯ-ნაბიჯ ინტეგრირებით). დეტალური ფორმულები იხილეთ აპლიკაციის „მოდელის მათემატიკური აღწერა“ განყოფილებაში.
          </p>
        </>
      )}

      {config.includeParamsTable && (
        <>
          <h2 className="report-section-title">3. გამოყენებული პარამეტრები</h2>
          <table className="report-table">
            <tbody>
              {PARAM_ROWS.map((p) => (
                <tr key={p.key}>
                  <td>{p.label}</td>
                  <td className="report-mono">{Number(run.metadata.params[p.key]).toFixed(4)}</td>
                </tr>
              ))}
              <tr>
                <td>ნიმუშების რაოდენობა</td>
                <td className="report-mono">{run.samples.length}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h2 className="report-section-title">4. შედეგები</h2>
      {config.includeDataSummary && (
        <table className="report-table">
          <tbody>
            <tr>
              <td>საბოლოო დრო t</td>
              <td className="report-mono">{last.t.toFixed(4)}</td>
            </tr>
            <tr>
              <td>T − t (საბოლოო)</td>
              <td className="report-mono">{last.timeToSingularity.toFixed(4)}</td>
            </tr>
            <tr>
              <td>მაქსიმალური |u| (საბოლოო ნიმუშში)</td>
              <td className="report-mono">{last.maxVelocity.toFixed(4)}</td>
            </tr>
            <tr>
              <td>მაქსიმალური ვორტიციტეტის პროქსი</td>
              <td className="report-mono">{last.maxVorticity.toFixed(4)}</td>
            </tr>
            <tr>
              <td>ბირთვის რადიუსი (საბოლოო)</td>
              <td className="report-mono">{last.coreRadius.toFixed(4)}</td>
            </tr>
            <tr>
              <td>ღერძული გაწელვა (საბოლოო)</td>
              <td className="report-mono">{last.stretchFactor.toFixed(4)}</td>
            </tr>
            <tr>
              <td>ენერგიის ინდექსი (საბოლოო)</td>
              <td className="report-mono">{last.kineticEnergyIndex.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      )}

      <h2 className="report-section-title">5. გრაფიკები</h2>
      {config.includeVelocityChart && (
        <div className="report-chart-block">
          <p className="report-chart-caption">მაქსიმალური სიჩქარე დროში</p>
          <div dangerouslySetInnerHTML={{ __html: miniLineChart(run.samples.map((s) => ({ x: s.t, y: s.maxVelocity })), '#f5a524') }} />
        </div>
      )}
      {config.includeVorticityChart && (
        <div className="report-chart-block">
          <p className="report-chart-caption">ვორტიციტეტის ზრდა</p>
          <div dangerouslySetInnerHTML={{ __html: miniLineChart(run.samples.map((s) => ({ x: s.t, y: s.maxVorticity })), '#ff6a2b') }} />
        </div>
      )}
      {config.includeEnergyChart && (
        <div className="report-chart-block">
          <p className="report-chart-caption">კინეტიკური ენერგიის ინდექსი</p>
          <div dangerouslySetInnerHTML={{ __html: miniLineChart(run.samples.map((s) => ({ x: s.t, y: s.kineticEnergyIndex })), '#4fa8db') }} />
        </div>
      )}

      {config.includeScreenshot && screenshotDataUrl && (
        <>
          <h2 className="report-section-title">3D მდგომარეობის კადრი</h2>
          <img src={screenshotDataUrl} alt="3D ვიზუალიზაციის კადრი" className="report-screenshot" />
        </>
      )}

      <h2 className="report-section-title">6. დაკვირვებები</h2>
      <p className="report-body">
        {run.metadata.note?.trim() ? run.metadata.note : 'ამ ექსპერიმენტისთვის ცალკე დაკვირვება არ არის დამატებული (იხილეთ „კვლევის ჩანაწერები“).'}
      </p>

      <h2 className="report-section-title">7. შეზღუდვები</h2>
      <ul className="report-list">
        {MODEL_ASSUMPTIONS_EN.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>

      {config.includeSources && (
        <>
          <h2 className="report-section-title">8. წყაროები</h2>
          <ul className="report-list">
            {SOURCES.map((s) => (
              <li key={s.url}>
                {s.organization} — {s.title}
                {s.date ? `, ${s.date}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="report-footer">
        ექსპერიმენტის ID: {run.metadata.id} · გენერირებულია: {new Date(run.generatedAt).toISOString()}
      </p>
    </div>
  );
});
