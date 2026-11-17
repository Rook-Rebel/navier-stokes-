import { useRef } from 'react';
import { useSimStore, type EquationTerm } from '../../hooks/useSimStore';
import { renderKatex } from '../../utils/katex';
import { Term } from '../common/Term';

type TermStatus = 'modeled' | 'simplified' | 'visual';

const STATUS_LABEL: Record<TermStatus, string> = {
  modeled: 'პირდაპირ მოდელირებულია',
  simplified: 'გამარტივებულია',
  visual: 'ვიზუალიზაციის დონეზეა წარმოდგენილი',
};

const TERM_CARDS: { id: EquationTerm; symbol: string; label: string; status: TermStatus; note: string }[] = [
  {
    id: 'dt',
    symbol: '\\partial u / \\partial t',
    label: 'დროში ცვლილება',
    status: 'simplified',
    note: 'დროში ევოლუცია არ არის ნაბიჯ-ნაბიჯ ინტეგრირებული — მთელი ტრაექტორია ერთბაშად გამოთვლილია ზუსტი დახურული ფორმულით.',
  },
  {
    id: 'advection',
    symbol: '(u \\cdot \\nabla) u',
    label: 'არაწრფივი გადატანა',
    status: 'visual',
    note: 'მოდელი ცალკე არ ხსნის ამ არაწრფივ წევრს — სპირალური „გადატანის“ შთაბეჭდილება მხოლოდ წინასწარ განსაზღვრული ბრუნვითი პროფილიდან მოდის.',
  },
  {
    id: 'pressure',
    symbol: '-\\nabla p',
    label: 'წნევის გრადიენტი',
    status: 'visual',
    note: 'წნევის ველი საერთოდ არ გამოითვლება ამ სათამაშო მოდელში — მისი როლი მხოლოდ კონცეპტუალურადაა ახსნილი.',
  },
  {
    id: 'viscosity',
    symbol: '\\nu \\Delta u',
    label: 'სიბლანტის მოქმედება',
    status: 'modeled',
    note: 'სიბლანტე ν ნამდვილად შედის ყველა ზრდის ფორმულაში, როგორც აშკარა შემანელებელი მამრავლი d(ν) = 1/(1+kν·ν).',
  },
  {
    id: 'forcing',
    symbol: 'f',
    label: 'გარე ძალის წევრი',
    status: 'simplified',
    note: 'ნამდვილი გარე ძალის ნაცვლად გამოყენებულია მცირე სინუსოიდური რხევა Ω(t)-ს ამპლიტუდაში.',
  },
  {
    id: 'divfree',
    symbol: '\\nabla \\cdot u = 0',
    label: 'უკუმშვადობის პირობა',
    status: 'modeled',
    note: 'ეს პირობა ზუსტადაა დაცული კონსტრუქციით — ორივე გამოყენებული წრფივი დაძაბვის ველი ცალ-ცალკე ნულოვანდივერგენციულია.',
  },
];

function EquationTermSpan({ id, tex }: { id: EquationTerm; tex: string }) {
  const highlighted = useSimStore((s) => s.highlightedTerm);
  const setHighlightedTerm = useSimStore((s) => s.setHighlightedTerm);
  const timeoutRef = useRef<number | null>(null);

  const clearLater = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setHighlightedTerm(null), 2200);
  };

  return (
    <span
      className={`equation-term${highlighted === id ? ' active' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={TERM_CARDS.find((c) => c.id === id)?.label}
      onMouseEnter={() => setHighlightedTerm(id)}
      onMouseLeave={() => setHighlightedTerm(null)}
      onFocus={() => setHighlightedTerm(id)}
      onBlur={() => setHighlightedTerm(null)}
      onClick={() => {
        setHighlightedTerm(id);
        clearLater();
      }}
      dangerouslySetInnerHTML={{ __html: renderKatex(tex) }}
    />
  );
}

/** "განტოლების ინსპექტორი" — for each term, states plainly whether the toy model directly models, simplifies, or only visually represents it. Never implies the app solves the full PDE. */
export function EquationSection() {
  const highlighted = useSimStore((s) => s.highlightedTerm);
  const setHighlightedTerm = useSimStore((s) => s.setHighlightedTerm);

  return (
    <section className="section" id="equation">
      <span className="eyebrow-label">განტოლების ინსპექტორი</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        <Term id="navierStokes" />
      </h2>
      <p className="section-sub">
        ინახეთ კურსორი ან შეეხეთ თითოეულ წევრს, რომ ნახოთ მისი კონცეპტუალური მნიშვნელობა, გავლენა 3D ვიზუალიზაციაზე ზემოთ, და — რაც ყველაზე მნიშვნელოვანია — რეალურად რას აკეთებს ჩვენი მოდელი ამ წევრთან მიმართებაში.
      </p>

      <div className="glass-panel equation-block" style={{ marginTop: 28 }}>
        <div style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <EquationTermSpan id="dt" tex="\partial u / \partial t" />
          <span dangerouslySetInnerHTML={{ __html: renderKatex('+') }} />
          <EquationTermSpan id="advection" tex="(u \cdot \nabla) u" />
          <span dangerouslySetInnerHTML={{ __html: renderKatex('=') }} />
          <EquationTermSpan id="pressure" tex="-\nabla p" />
          <span dangerouslySetInnerHTML={{ __html: renderKatex('+') }} />
          <EquationTermSpan id="viscosity" tex="\nu \Delta u" />
          <span dangerouslySetInnerHTML={{ __html: renderKatex('+') }} />
          <EquationTermSpan id="forcing" tex="f" />
        </div>
        <div style={{ fontSize: '1.15rem' }}>
          <EquationTermSpan id="divfree" tex="\nabla \cdot u = 0" />
        </div>

        <div className="equation-term-legend">
          {TERM_CARDS.map((c) => (
            <button
              key={c.id}
              className={`equation-term-card${highlighted === c.id ? ' active' : ''}`}
              onMouseEnter={() => setHighlightedTerm(c.id)}
              onMouseLeave={() => setHighlightedTerm(null)}
              onClick={() => setHighlightedTerm(highlighted === c.id ? null : c.id)}
            >
              <div className="equation-term-card-symbol" dangerouslySetInnerHTML={{ __html: renderKatex(c.symbol) }} />
              <div className="equation-term-card-label">{c.label}</div>
              <div className={`term-status-badge status-${c.status}`}>{STATUS_LABEL[c.status]}</div>
              <div className="equation-term-card-note">{c.note}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
