import type { MealStatusValue } from '../db/db';

const STATUS_BTNS: { value: MealStatusValue; label: string }[] = [
  { value: 'eaten', label: '✓ Mangiato' },
  { value: 'half', label: '½ Metà' },
  { value: 'skipped', label: '✕ Saltato' },
];

// Bottoni mangiato/metà/saltato (ri-tocco dello stato attivo = annulla, gestito dal chiamante).
export function MealStatusButtons({
  active,
  onSelect,
}: {
  active?: MealStatusValue;
  onSelect: (v: MealStatusValue) => void;
}) {
  return (
    <>
      {STATUS_BTNS.map((b) => (
        <button
          key={b.value}
          onClick={() => onSelect(b.value)}
          className={active === b.value ? 'btn' : 'btn ghost'}
          style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem', flex: '0 0 auto' }}
        >
          {b.label}
        </button>
      ))}
    </>
  );
}
