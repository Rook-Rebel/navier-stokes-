import { useSimStore } from '../../hooks/useSimStore';
import { useDiagnosticCurve } from '../../hooks/useDiagnosticCurve';
import { TimeSeriesChart } from './TimeSeriesChart';
import { Term } from '../common/Term';

export function ChartsSection() {
  const t = useSimStore((s) => s.t);
  const params = useSimStore((s) => s.params);
  const curve = useDiagnosticCurve(params);

  return (
    <section className="section" id="graphs">
      <div className="section-label-row">
        <span className="eyebrow-label">სინქრონიზებული გრაფიკები</span>
      </div>
      <h2 className="section-heading">დინამიკის გრაფიკული ანალიზი</h2>
      <p className="section-sub">
        ყველა გრაფიკი პირდაპირ გამომდინარეობს იმავე მათემატიკური მოდელიდან, რომელიც მართავს 3D ვიზუალიზაციას — მონაცემები არ არის შემთხვევითი. დააწკაპუნეთ ნებისმიერ წერტილზე, რომ სიმულაციის <Term id="time" /> იქ გადაინაცვლოს.
      </p>
      <div className="charts-grid" style={{ marginTop: 24 }}>
        <TimeSeriesChart
          title="მაქსიმალური სიჩქარე დროში"
          yLabel="მაქს. სიჩქარე"
          color="var(--amber-fast)"
          currentT={t}
          data={curve.map((c) => ({ t: c.t, value: c.maxVelocity }))}
        />
        <TimeSeriesChart
          title="ვორტიციტეტის ზრდა"
          yLabel="ვორტიციტეტი"
          color="#ff6a2b"
          currentT={t}
          data={curve.map((c) => ({ t: c.t, value: c.vorticityIndex }))}
        />
        <TimeSeriesChart
          title="ვორტექსის რადიუსი"
          yLabel="რადიუსი"
          color="var(--teal-slow)"
          currentT={t}
          data={curve.map((c) => ({ t: c.t, value: c.radialScale }))}
        />
        <TimeSeriesChart
          title="კინეტიკური ენერგია"
          yLabel="ენერგია"
          color="var(--accent-primary)"
          currentT={t}
          data={curve.map((c) => ({ t: c.t, value: c.kineticEnergyIndex }))}
        />
      </div>
    </section>
  );
}
