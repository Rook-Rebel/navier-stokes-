import { useId, useState } from 'react';
import { TERMS } from '../../data/terminology';

interface TermProps {
  id: keyof typeof TERMS;
  /** Override the displayed label; defaults to the canonical Georgian term. */
  label?: string;
}

/** Inline term with a dotted underline and an accessible hover/tap tooltip, per the app-wide glossary. */
export function Term({ id, label }: TermProps) {
  const def = TERMS[id];
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!def) return <span>{label ?? String(id)}</span>;

  return (
    <span
      className="tooltip-term"
      tabIndex={0}
      role="button"
      aria-describedby={tooltipId}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      style={{ position: 'relative' }}
    >
      {label ?? def.term}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            maxWidth: '70vw',
            padding: '10px 12px',
            background: 'var(--bg-glass-strong)',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            zIndex: 60,
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            fontWeight: 400,
            whiteSpace: 'normal',
          }}
        >
          {def.tooltip}
        </span>
      )}
    </span>
  );
}
