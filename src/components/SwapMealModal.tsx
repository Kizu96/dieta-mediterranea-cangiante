import { useMemo } from 'react';
import { Package, Snowflake } from 'lucide-react';
import type { MealSlot, Season } from '../data/types';
import { db } from '../db/db';
import { rankReplacements, usesExpiring, usesSurplus, type SwapContext } from '../lib/swap';
import { scaleRound } from '../lib/intensity';
import { Modal } from './Modal';
import { SLOT_LABEL } from './labels';

// Scambio pasto MANUALE («scelgo io cosa mangio davvero»), per un giorno qualsiasi.
// Scrive un mealOverride per quella data+slot (il piano base non si tocca) e si può
// ripristinare. Stesso modale per Oggi, Pasti di domani e Piano→Giorno: un'unica fonte
// per il ranking «usa prima ciò che va a male / hai in abbondanza» e per i badge.
export function SwapMealModal({
  dateISO,
  slot,
  currentId,
  whenLabel,
  season,
  includeExtra,
  ctx,
  factor,
  isOverridden,
  onClose,
}: {
  dateISO: string;
  slot: MealSlot;
  currentId: string;
  whenLabel: string; // «oggi», «domani» o la data: entra nel titolo e nel testo
  season: Season;
  includeExtra: boolean;
  ctx: SwapContext;
  factor: number;
  isOverridden: boolean; // c'è già uno scambio per questo giorno/slot → mostra «Ripristina»
  onClose: () => void;
}) {
  // In cima la migliore alternativa diversa dal pasto attuale: il «consigliato».
  const ordered = useMemo(() => {
    const ranked = rankReplacements(slot, season, includeExtra, ctx);
    const recommendedId = ranked.find((r) => r.id !== currentId)?.id;
    const sorted =
      recommendedId == null
        ? ranked
        : [
            ...ranked.filter((r) => r.id === recommendedId),
            ...ranked.filter((r) => r.id !== recommendedId),
          ];
    return { sorted, recommendedId };
  }, [slot, season, includeExtra, ctx, currentId]);

  const setOverride = (recipeId: string) =>
    db.mealOverride.put({ date: dateISO, slot, recipeId, updatedAt: Date.now() });
  const clearOverride = () => db.mealOverride.delete([dateISO, slot]);

  return (
    <Modal title={`Scambia ${SLOT_LABEL[slot]} di ${whenLabel}`} onClose={onClose}>
      <p className="small muted" style={{ marginTop: -4 }}>
        Scegli cosa mangi davvero al posto del pasto del piano. Vale <b>solo per {whenLabel}</b> e
        aggiorna anche la lista della spesa. In cima trovi le ricette che smaltiscono ciò che sta
        per scadere («in scadenza») o che hai in abbondanza («usa la dispensa»).
      </p>
      <ul className="clean">
        {ordered.sorted.map((r) => (
          <li
            key={r.id}
            className="meal-row"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setOverride(r.id);
              onClose();
            }}
          >
            <span className="grow">
              {r.name}
              {r.id === ordered.recommendedId && (
                <span
                  className="pill"
                  style={{ marginLeft: 6, background: 'var(--olive)', color: '#fff', borderColor: 'var(--olive)' }}
                >
                  ★ consigliato
                </span>
              )}
              {r.id === currentId && <span className="pill olive" style={{ marginLeft: 6 }}>attuale</span>}
              {ctx.favorites?.has(r.id) && (
                <span className="pill terracotta" style={{ marginLeft: 6 }}>♥</span>
              )}
              {usesExpiring(r, ctx.perish) && (
                <span className="pill" style={{ marginLeft: 6 }}><Snowflake size={12} className="ic" /> in scadenza</span>
              )}
              {usesSurplus(r, ctx.surplus) && r.id !== currentId && (
                <span className="pill" style={{ marginLeft: 6 }}><Package size={12} className="ic" /> usa la dispensa</span>
              )}
            </span>
            <span className="nowrap muted">{scaleRound(r.kcal, factor)} kcal</span>
          </li>
        ))}
      </ul>
      {isOverridden && (
        <button
          className="btn ghost block"
          style={{ marginTop: 8 }}
          onClick={() => {
            clearOverride();
            onClose();
          }}
        >
          ↩︎ Ripristina il pasto del piano
        </button>
      )}
    </Modal>
  );
}
