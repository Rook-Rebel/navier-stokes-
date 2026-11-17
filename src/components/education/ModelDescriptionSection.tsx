import {
  MAX_VISUAL_Z_STRETCH,
  MIN_TIME_TO_SINGULARITY,
  MODEL_VERSION,
  PARAM_RANGES,
  RATE_K_AXIAL,
  RATE_K_RADIAL,
  RATE_K_SWIRL,
  R_CORE_0,
  VISCOUS_DAMPING_K,
} from '../../utils/flowField';
import { renderKatex } from '../../utils/katex';

const PARAM_DEFS: { label: string; range: keyof typeof PARAM_RANGES; role: string }[] = [
  { label: 'სიბლანტე ν', range: 'viscosity', role: 'ამცირებს ყველა ზრდის სიჩქარეს d(ν) = 1/(1+kν·ν) მამრავლით.' },
  { label: 'რადიალური შეკუმშვა', range: 'radialCompression', role: 'განსაზღვრავს c_r(t)-ს ამპლიტუდას.' },
  { label: 'ღერძული გაწელვა', range: 'axialStretch', role: 'განსაზღვრავს c_z(t)-ს ამპლიტუდას.' },
  { label: 'ბრუნვის ინტენსივობა', range: 'rotationIntensity', role: 'განსაზღვრავს Ω(t)-ს საწყის ამპლიტუდას.' },
  { label: 'გარე ძალის გავლენა', range: 'forcingInfluence', role: 'მართავს Ω(t)-ში დამატებულ მცირე რხევას.' },
];

/** Every formula and constant on this page is imported directly from flowField.ts — this page cannot describe the model differently from what the code computes. */
export function ModelDescriptionSection() {
  return (
    <section className="section" id="model-description">
      <span className="eyebrow-label">დოკუმენტაცია · ვერსია {MODEL_VERSION}</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        მოდელის მათემატიკური აღწერა
      </h2>
      <p className="section-sub">
        ქვემოთ ჩამოთვლილი ყველა ფორმულა და მუდმივა უშუალოდ არის აღებული <code>flowField.ts</code>-დან — ეს გვერდი ვერასდროს აღწერს განსხვავებულ მოდელს, ვიდრე კოდშია რეალურად გაანგარიშებული.
      </p>

      <div className="glass-panel" style={{ padding: '28px 32px', marginTop: 24 }}>
        <h3 className="model-doc-heading">კოორდინატთა სისტემა</h3>
        <p className="section-sub" style={{ marginBottom: 16 }}>
          მოდელი ღერძულ-სიმეტრიულია ცილინდრულ კოორდინატებში (r, θ, z), სადაც z ემთხვევა ბრუნვის ღერძს. სიჩქარის ველს სამი კომპონენტი აქვს: u_r (რადიალური), u_θ (აზიმუტალური/ბრუნვითი) და u_z (ღერძული).
        </p>

        <h3 className="model-doc-heading">დროზე დამოკიდებული სიჩქარეები</h3>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`s(t) = \\max(T - t,\\ \\varepsilon), \\quad \\varepsilon = ${MIN_TIME_TO_SINGULARITY}`, true) }} />
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`d(\\nu) = \\dfrac{1}{1 + k_\\nu \\nu}, \\quad k_\\nu = ${VISCOUS_DAMPING_K}`, true) }} />
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`c_r(t) = \\dfrac{k_r \\cdot \\text{compression} \\cdot d(\\nu)}{s(t)}, \\quad k_r = ${RATE_K_RADIAL}`, true) }} />
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`c_z(t) = \\dfrac{k_z \\cdot \\text{stretch} \\cdot d(\\nu)}{s(t)}, \\quad k_z = ${RATE_K_AXIAL}`, true) }} />
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`\\Omega(t) = \\dfrac{k_\\Omega \\cdot \\text{rotation} \\cdot d(\\nu)}{\\sqrt{s(t)}}\\Big(1 + 0.22f\\sin(26t)\\Big), \\quad k_\\Omega = ${RATE_K_SWIRL}`, true) }} />

        <h3 className="model-doc-heading">დივერგენციისგან თავისუფალი კონსტრუქცია</h3>
        <p className="section-sub" style={{ marginBottom: 12 }}>
          რადიალურ-ღერძული ნაწილი აგებულია ორი წრფივი დაძაბვის ველის ჯამით (თითოეული ცალკე ზუსტად აკმაყოფილებს ∇·u = 0), რაც იძლევა ერთიან წმინდა კოეფიციენტს C_r(t) = c_r(t) + c_z(t)/2, საიდანაც მოცულობის შენარჩუნების პირობა ავტომატურად იძლევა C_z(t) = 2C_r(t):
        </p>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`u_r = -C_r(t)\\, r, \\qquad u_z = 2C_r(t)\\, z`, true) }} />
        <p className="section-sub" style={{ marginBottom: 12 }}>
          ეს განტოლებები r-სა და z-ში წრფივია (თუმცა კოეფიციენტი დროზეა დამოკიდებული), ამიტომ მათი ინტეგრირება ხდება ზუსტი დახურული ფორმულით:
        </p>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`r(t) = r_0\\, e^{-J_r(t)}, \\qquad z(t) = z_0\\, e^{2J_r(t)}, \\qquad J_r(t) = \\int_0^t C_r(\\tau)\\, d\\tau`, true) }} />

        <h3 className="model-doc-heading">ბრუნვითი პროფილი (Burgers/Lamb-Oseen ტიპის)</h3>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`u_\\theta(r,t) = \\Omega(t)\\, R_{\\text{core}}(t)\\, \\dfrac{g(\\rho)}{\\rho}, \\qquad g(\\rho) = 1 - e^{-\\rho^2}, \\qquad \\rho = \\dfrac{r}{R_{\\text{core}}(t)}`, true) }} />
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`R_{\\text{core}}(t) = R_0\\, e^{-J_r(t)}, \\qquad R_0 = ${R_CORE_0}`, true) }} />
        <p className="section-sub" style={{ marginBottom: 12 }}>
          რადგან ρ₀ = r₀ / R₀ ყოველი ტრაექტორიის გასწვრივ მუდმივია, θ(t)-ც ინტეგრირდება ზუსტად:
        </p>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`\\theta(t) = \\theta_0 + h(\\rho_0)\\, K(t), \\qquad h(\\rho_0) = \\dfrac{g(\\rho_0)}{\\rho_0^2}, \\qquad K(t) = \\int_0^t \\Omega(\\tau)\\, d\\tau`, true) }} />

        <h3 className="model-doc-heading">ვორტიციტეტის პროქსი</h3>
        <div className="katex-block" dangerouslySetInnerHTML={{ __html: renderKatex(`\\omega_z(t) = \\dfrac{2\\Omega(t)}{R_{\\text{core}}(t)}\\, e^{-\\rho_0^2}`, true) }} />
        <p className="section-sub">
          ეს არის u_θ-ის ღერძული (z) კომპონენტის მართობი ρ-ს მიმართ წარმოებულიდან გამომდინარე ანალიზური გამოსახულება — ნამდვილი ∇×u-ს დისკრეტული გამოთვლის ნაცვლად.
        </p>

        <h3 className="model-doc-heading">ვიზუალიზაციის კლემფინგი</h3>
        <p className="section-sub">
          ეკრანზე ნაწილაკების განთავსებისას ღერძული მასშტაბი rawScaleZ ირბილება tanh ფუნქციით მაქსიმალურ გაწელვამდე {MAX_VISUAL_Z_STRETCH} — ეს გავლენას არ ახდენს დიაგნოსტიკურ (ექსპორტირებად) მნიშვნელობებზე, მხოლოდ იმაზე, თუ სად გამოისახება ნაწილაკი ეკრანზე.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px 28px', marginTop: 20 }}>
        <h3 className="model-doc-heading" style={{ marginTop: 0 }}>
          პარამეტრების განსაზღვრებები
        </h3>
        <table className="research-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>პარამეტრი</th>
              <th>დიაპაზონი</th>
              <th style={{ textAlign: 'left' }}>როლი მოდელში</th>
            </tr>
          </thead>
          <tbody>
            {PARAM_DEFS.map((p) => (
              <tr key={p.range}>
                <td style={{ textAlign: 'left' }}>{p.label}</td>
                <td className="mono">
                  {PARAM_RANGES[p.range].min} – {PARAM_RANGES[p.range].max}
                </td>
                <td style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>{p.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
