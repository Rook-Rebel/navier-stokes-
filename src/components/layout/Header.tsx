function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const LINKS: { id: string; label: string }[] = [
  { id: 'laboratory', label: 'ლაბორატორია' },
  { id: 'steps', label: 'მექანიზმი' },
  { id: 'equation', label: 'განტოლება' },
  { id: 'scientific-status', label: 'მტკიცება' },
  { id: 'sources', label: 'წყაროები' },
];

export function Header() {
  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <span className="top-nav-brand-mark" aria-hidden="true" />
        <span>ნავიე-სტოქსის სინგულარობა</span>
      </div>
      <nav className="top-nav-links" aria-label="მთავარი ნავიგაცია">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollTo(l.id);
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
