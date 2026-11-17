import { useSimStore } from '../../hooks/useSimStore';
import { PARAM_RANGES } from '../../utils/flowField';
import { Slider } from '../common/Slider';

const TOOLTIPS = {
  viscosity:
    'განსაზღვრავს რამდენად სწრაფად ირბილება სიჩქარის მკვეთრი ცვლილებები — მაღალი სიბლანტე ანელებს სინგულარობისკენ მიახლოებას.',
  radialCompression: 'აკონტროლებს რამდენად ინტენსიურად იკუმშება მორევის რადიუსი ღერძისკენ დროის განმავლობაში.',
  axialStretch: 'აკონტროლებს რამდენად ინტენსიურად იწელება სტრუქტურა ბრუნვის ღერძის გასწვრივ — მოცულობის შენარჩუნებით ეს რადიალურ შეკუმშვას თან ახლავს.',
  rotationIntensity: 'მართავს მორევის საწყის კუთხურ სიჩქარეს — რაც მეტია მნიშვნელობა, მით უფრო სწრაფად ბრუნავს სტრუქტურა.',
  forcingInfluence: 'მართავს მოდელში დამატებული, გარე ძალის მსგავსი მცირე რხევის ამპლიტუდას.',
  particleCount: 'სცენაში ერთდროულად გამოსახული ნაწილაკების საერთო რაოდენობა.',
  trailLength: 'თითოეული ტრაექტორიის გახსენებული წარსულის სიგრძე — რამდენი წინარე მდგომარეობა ჩანს კვალში.',
  visualSpeed: 'დამატებითი, დამარტივებული მასშტაბი დროის დინების აღქმად სისწრაფეზე, დამოუკიდებელი გაშვების სიჩქარის ღილაკებისგან.',
} as const;

export function ParameterPanel() {
  const params = useSimStore((s) => s.params);
  const setParam = useSimStore((s) => s.setParam);
  const resetParams = useSimStore((s) => s.resetParams);

  return (
    <div className="side-panel-block">
      <div className="side-panel-title">
        <span>პარამეტრები</span>
      </div>

      <Slider
        label="სიბლანტე ν"
        value={params.viscosity}
        min={PARAM_RANGES.viscosity.min}
        max={PARAM_RANGES.viscosity.max}
        step={PARAM_RANGES.viscosity.step}
        onChange={(v) => setParam('viscosity', v)}
        tooltip={TOOLTIPS.viscosity}
      />
      <Slider
        label="რადიალური შეკუმშვა"
        value={params.radialCompression}
        min={PARAM_RANGES.radialCompression.min}
        max={PARAM_RANGES.radialCompression.max}
        step={PARAM_RANGES.radialCompression.step}
        onChange={(v) => setParam('radialCompression', v)}
        tooltip={TOOLTIPS.radialCompression}
      />
      <Slider
        label="ღერძული გაწელვა"
        value={params.axialStretch}
        min={PARAM_RANGES.axialStretch.min}
        max={PARAM_RANGES.axialStretch.max}
        step={PARAM_RANGES.axialStretch.step}
        onChange={(v) => setParam('axialStretch', v)}
        tooltip={TOOLTIPS.axialStretch}
      />
      <Slider
        label="ბრუნვის ინტენსივობა"
        value={params.rotationIntensity}
        min={PARAM_RANGES.rotationIntensity.min}
        max={PARAM_RANGES.rotationIntensity.max}
        step={PARAM_RANGES.rotationIntensity.step}
        onChange={(v) => setParam('rotationIntensity', v)}
        tooltip={TOOLTIPS.rotationIntensity}
      />
      <Slider
        label="გარე ძალის გავლენა"
        value={params.forcingInfluence}
        min={PARAM_RANGES.forcingInfluence.min}
        max={PARAM_RANGES.forcingInfluence.max}
        step={PARAM_RANGES.forcingInfluence.step}
        onChange={(v) => setParam('forcingInfluence', v)}
        tooltip={TOOLTIPS.forcingInfluence}
      />
      <Slider
        label="ნაწილაკების რაოდენობა"
        value={params.particleCount}
        min={2000}
        max={30000}
        step={500}
        displayValue={String(params.particleCount)}
        onChange={(v) => setParam('particleCount', Math.round(v))}
        tooltip={TOOLTIPS.particleCount}
      />
      <Slider
        label="ტრაექტორიის სიგრძე"
        value={params.trailLength}
        min={10}
        max={150}
        step={5}
        displayValue={String(params.trailLength)}
        onChange={(v) => setParam('trailLength', Math.round(v))}
        tooltip={TOOLTIPS.trailLength}
      />
      <Slider
        label="ვიზუალიზაციის სიჩქარე"
        value={params.visualSpeed}
        min={PARAM_RANGES.visualSpeed.min}
        max={PARAM_RANGES.visualSpeed.max}
        step={PARAM_RANGES.visualSpeed.step}
        onChange={(v) => setParam('visualSpeed', v)}
        tooltip={TOOLTIPS.visualSpeed}
      />

      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={resetParams}>
        საწყისი პარამეტრები
      </button>
    </div>
  );
}
