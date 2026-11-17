import { SOURCES, SOURCE_CATEGORY_LABELS } from '../../data/sources';

export function SourcesSection() {
  return (
    <section className="section" id="sources">
      <span className="eyebrow-label">დოკუმენტაცია</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        წყაროები და მტკიცება
      </h2>
      <p className="section-sub">
        ყველა ბმული ეხება რეალურ, საჯაროდ ხელმისაწვდომ წყაროებს. აქ არაფერია გამოგონილი — არც ავტორები, არც თარიღები, არც ციტატები. წყაროები დაყოფილია იმის მიხედვით, თუ რას ადასტურებენ.
      </p>

      <div className="sources-grid">
        {SOURCES.map((s) => (
          <div className="glass-panel source-card" key={s.url}>
            <span className={`source-category-badge source-category-${s.category}`}>
              {SOURCE_CATEGORY_LABELS[s.category]}
            </span>
            <span className="source-org">{s.organization}</span>
            <span className="source-title">{s.title}</span>
            {s.date && <span className="source-date">{s.date}</span>}
            <p className="source-desc">{s.description}</p>
            <a
              className="btn btn-ghost btn-sm"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ alignSelf: 'flex-start' }}
            >
              {s.linkLabel}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
