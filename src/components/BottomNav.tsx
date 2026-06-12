import type { ReactNode } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChefHat,
  CookingPot,
  Dumbbell,
  Scale,
  ShoppingBasket,
  ShoppingCart,
  Sun,
} from 'lucide-react';

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
  icon: ReactNode;
}

// Icone lucide (SVG monocromatici, currentColor): look pulito e coerente
// al posto delle emoji, che cambiano resa da un dispositivo all'altro.
const ICON_SIZE = 20;
const ITEMS: NavItem[] = [
  { key: 'oggi', label: 'Oggi', icon: <Sun size={ICON_SIZE} /> },
  { key: 'piano', label: 'Piano', icon: <CalendarDays size={ICON_SIZE} /> },
  { key: 'prep', label: 'Prep day', icon: <ChefHat size={ICON_SIZE} /> },
  { key: 'ricette', label: 'Ricette', icon: <CookingPot size={ICON_SIZE} /> },
  { key: 'dispensa', label: 'Dispensa', icon: <ShoppingBasket size={ICON_SIZE} /> },
  { key: 'spesa', label: 'Spesa', icon: <ShoppingCart size={ICON_SIZE} /> },
  { key: 'peso', label: 'Peso', icon: <Scale size={ICON_SIZE} /> },
  { key: 'allenamenti', label: 'Workout', icon: <Dumbbell size={ICON_SIZE} /> },
  { key: 'guida', label: 'Guida', icon: <BookOpen size={ICON_SIZE} /> },
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
          <span className="nav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
