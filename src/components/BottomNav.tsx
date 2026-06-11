// Barra di navigazione inferiore (Android-friendly). Switch di vista via stato.
export type ViewKey =
  | 'oggi'
  | 'piano'
  | 'prep'
  | 'ricette'
  | 'dispensa'
  | 'spesa'
  | 'peso'
  | 'allenamenti'
  | 'guida';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: string;
}

const ITEMS: NavItem[] = [
  { key: 'oggi', label: 'Oggi', icon: '🌅' },
  { key: 'piano', label: 'Piano', icon: '🗓️' },
  { key: 'prep', label: 'Prep day', icon: '🍱' },
  { key: 'ricette', label: 'Ricette', icon: '🍲' },
  { key: 'dispensa', label: 'Dispensa', icon: '🧺' },
  { key: 'spesa', label: 'Spesa', icon: '🛒' },
  { key: 'peso', label: 'Peso', icon: '⚖️' },
  { key: 'allenamenti', label: 'Workout', icon: '🏃' },
  { key: 'guida', label: 'Guida', icon: '📖' },
];

export function BottomNav({
  current,
  onChange,
}: {
  current: ViewKey;
  onChange: (v: ViewKey) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      <div className="nav-brand" aria-hidden="true">
        🫒 Dieta Cangiante
      </div>
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className={current === it.key ? 'active' : ''}
          aria-current={current === it.key ? 'page' : undefined}
          onClick={() => onChange(it.key)}
        >
          <span className="nav-icon" aria-hidden="true">
            {it.icon}
          </span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}
