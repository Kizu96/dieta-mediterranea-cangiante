import type { ReactNode } from 'react';

// Riga con checkbox a grande area di tocco (toggle persistito dal chiamante).
export function CheckRow({
  checked,
  title,
  detail,
  right,
  onToggle,
}: {
  checked: boolean;
  title: ReactNode;
  detail?: ReactNode;
  right?: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={checked ? 'check-row checked' : 'check-row'}
      onClick={onToggle}
      aria-pressed={checked}
    >
      <span className="check-box" aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      <span className="check-main">
        <span className="check-title">{title}</span>
        {detail && <span className="check-detail">{detail}</span>}
      </span>
      {right}
    </button>
  );
}
