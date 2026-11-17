import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ComparePoints } from '../simulation/ComparePoints';
import { LazyMount } from '../common/LazyMount';
import { MAX_SIM_TIME } from '../../utils/flowField';

export function ComparisonSection() {
  const [t, setT] = useState(0.4);

  return (
    <section className="section" id="comparison">
      <span className="eyebrow-label">კონცეპტუალური შედარება</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        რას ველოდით? — რას გვთავაზობს ახალი კონსტრუქცია?
      </h2>

      <LazyMount minHeight={360}>
        <div className="comparison-grid">
          <div className="comparison-col">
            <div className="comparison-col-title">რას ველოდით? — სიბლანტე მოძრაობას ასწორებს</div>
            <div className="comparison-col-viz">
              <Canvas camera={{ position: [4.2, 2, 4.2], fov: 46 }} dpr={[1, 1.5]}>
                <color attach="background" args={['#03050a']} />
                <ambientLight intensity={0.5} />
                <ComparePoints variant="decaying" t={t} />
              </Canvas>
            </div>
            <p className="comparison-col-text">
              კლასიკური ინტუიციით, სიბლანტე თანდათან შლის მორევს — ბირთვი ფართოვდება და ბრუნვა ნელდება.
            </p>
          </div>
          <div className="comparison-col">
            <div className="comparison-col-title">ახალი კონსტრუქცია — შეკუმშვა და გაწელვა ძლიერდება</div>
            <div className="comparison-col-viz">
              <Canvas camera={{ position: [4.2, 2, 4.2], fov: 46 }} dpr={[1, 1.5]}>
                <color attach="background" args={['#03050a']} />
                <ambientLight intensity={0.5} />
                <ComparePoints variant="singular" t={t} />
              </Canvas>
            </div>
            <p className="comparison-col-text">
              ახალი კონსტრუქციის მიხედვით შესაძლებელია ისეთი დინების აგება, სადაც შეკუმშვა და გაწელვა დროთა განმავლობაში ძლიერდება და ლოკალური სიჩქარე კრიტიკული დროისკენ სწრაფად იზრდება.
            </p>
          </div>
        </div>
      </LazyMount>

      <div className="glass-panel" style={{ padding: '14px 20px', marginTop: 16 }}>
        <div className="param-slider" style={{ marginBottom: 0 }}>
          <div className="param-slider-head">
            <span className="param-slider-label">საერთო დროის კონტროლი (ორივე სცენისთვის)</span>
            <span className="param-slider-value mono">t = {t.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_SIM_TIME}
            step={0.001}
            value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            aria-label="შედარების საერთო დროის ღერძი"
            style={{ ['--pct' as string]: `${(t / MAX_SIM_TIME) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-panel comparison-explainer">
        სიბლანტე ჩვეულებრივ არბილებს სიჩქარის მკვეთრ ცვლილებებს. ახალი კონსტრუქციის მთავარი იდეაა ისეთი დინების აგება, სადაც მოძრაობის სხვადასხვა დიდი წევრი განსაკუთრებული სიზუსტით ბალანსდება, ხოლო ლოკალური სიჩქარე მაინც შეუზღუდავად იზრდება.
      </div>
    </section>
  );
}
