import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import type { MealStatusValue } from '../db/db';
import { Modal } from './Modal';

const STATUS_BTNS: { value: MealStatusValue; label: string }[] = [
  { value: 'eaten', label: '✓ Mangiato' },
  { value: 'half', label: '½ Metà' },
  { value: 'skipped', label: '✕ Saltato' },
];

// Taglie oneste per il pasto fuori piano: nessuno sa le kcal esatte di una
// pizza o del coreano — una stima a fasce batte sempre uno zero finto.
const OFFPLAN_SIZES: { label: string; desc: string; kcal: number }[] = [
  { label: 'Leggero', desc: 'insalatona, poke piccolo, riso e verdure…', kcal: 400 },
  { label: 'Normale', desc: 'piatto da ristorante, bowl, panino farcito…', kcal: 700 },
  { label: 'Abbondante', desc: 'pizza intera, menu completo, fritti…', kcal: 1100 },
];

// Bottoni mangiato/metà/saltato (ri-tocco dello stato attivo = annulla, gestito
// dal chiamante). «Saltato» chiede prima: hai digiunato davvero o hai mangiato
// altro? Nel secondo caso registra un pasto FUORI PIANO con kcal stimate, così
// barra calorie e aderenza restano oneste.
export function MealStatusButtons({
  active,
  offPlanKcal,
  onSelect,
}: {
  active?: MealStatusValue;
  offPlanKcal?: number;
  onSelect: (v: MealStatusValue, offPlanKcal?: number) => void;
}) {
  const [asking, setAsking] = useState(false);

  const handleTap = (v: MealStatusValue) => {
    // «Saltato» su un pasto non ancora saltato → prima la domanda.
    if (v === 'skipped' && active !== 'skipped') {
      setAsking(true);
      return;
    }
    onSelect(v);
  };

  return (
    <>
      {STATUS_BTNS.map((b) => (
        <button
          key={b.value}
          onClick={() => handleTap(b.value)}
          className={active === b.value ? 'btn' : 'btn ghost'}
          style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem', flex: '0 0 auto' }}
        >
          {b.label}
        </button>
      ))}
      {active === 'offplan' && (
        <button
          onClick={() => onSelect('offplan')}
          className="btn terracotta"
          style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem', flex: '0 0 auto' }}
          title="Tocca per annullare"
        >
          <UtensilsCrossed size={13} className="ic" /> Fuori piano
          {offPlanKcal != null ? ` · ~${offPlanKcal} kcal` : ''}
        </button>
      )}

      {asking && (
        <Modal title="Hai digiunato?" onClose={() => setAsking(false)}>
          <p className="small muted" style={{ marginTop: -4 }}>
            Se hai saltato davvero il pasto segno zero calorie. Se invece hai mangiato
            qualcos'altro (fuori, a casa, ordinato…) meglio una stima onesta: conta per la
            barra calorie e per l'aderenza.
          </p>
          <button
            className="btn block"
            style={{ marginBottom: 14 }}
            onClick={() => {
              setAsking(false);
              onSelect('skipped');
            }}
          >
            Sì, ho digiunato
          </button>
          <h3 className="section-label">No, ho mangiato altro — più o meno quanto?</h3>
          <ul className="clean">
            {OFFPLAN_SIZES.map((s) => (
              <li key={s.label}>
                <button
                  className="btn ghost block"
                  style={{ marginBottom: 8, justifyContent: 'space-between', textAlign: 'left' }}
                  onClick={() => {
                    setAsking(false);
                    onSelect('offplan', s.kcal);
                  }}
                >
                  <span>
                    <b>{s.label}</b>
                    <span className="small muted" style={{ display: 'block', fontWeight: 400 }}>
                      {s.desc}
                    </span>
                  </span>
                  <span className="nowrap">~{s.kcal} kcal</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            La dispensa non viene toccata: gli ingredienti del pasto previsto sono ancora lì.
          </p>
        </Modal>
      )}
    </>
  );
}
