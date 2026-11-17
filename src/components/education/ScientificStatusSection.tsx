interface StatusItem {
  title: string;
  state: 'done' | 'pending' | 'not-yet';
  badge: string;
}

const ITEMS: StatusItem[] = [
  { title: 'გამოქვეყნებული მტკიცება', state: 'done', badge: '✓' },
  { title: 'Lean ფორმალიზაცია', state: 'done', badge: '✓' },
  { title: 'ფართო დამოუკიდებელი მათემატიკური შეფასება', state: 'pending', badge: 'მიმდინარეობს' },
  { title: 'Clay Mathematics Institute-ის საბოლოო ოფიციალური აღიარება', state: 'not-yet', badge: 'ჯერ არა' },
];

export function ScientificStatusSection() {
  return (
    <section className="section" id="scientific-status">
      <span className="eyebrow-label">სამეცნიერო სტატუსი</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        რას ნიშნავს ეს შედეგი დღეს?
      </h2>
      <p className="section-sub">
        2026 წლის 8 სექტემბერს გამოქვეყნდა ანალიტიკური მტკიცება და Lean-ში ფორმალიზებული ვერსია, რომლის მიხედვითაც სამგანზომილებიან ნავიე-სტოქსის სისტემაში შესაბამისი გლუვი გარე ძალის პირობებში შეიძლება სასრულ დროში სინგულარობა წარმოიქმნას.
      </p>

      <div className="status-grid">
        {ITEMS.map((item) => (
          <div className="glass-panel status-card" key={item.title}>
            <span className={`status-badge ${item.state}`}>{item.badge}</span>
            <span className="status-card-title">{item.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
