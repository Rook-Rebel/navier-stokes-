import { useId, useState } from 'react';

interface InfoTipProps {
  text: string;
}

/** A small "?" icon that reveals a Georgian explanation on hover/tap — used next to parameter labels. */
export function InfoTip({ text }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label="ახსნა"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '1px solid var(--border-strong)',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          fontSize: 10,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
        }}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 220,
            padding: '9px 11px',
            background: 'var(--bg-glass-strong)',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            fontSize: '0.76rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            zIndex: 80,
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
