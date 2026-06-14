import { useCallback, useEffect, useRef, useState } from 'react';
import { AlarmClock, Check, ChefHat, Play } from 'lucide-react';
import type { Recipe } from '../data/types';
import { ingredientById } from '../lib/shopping';
import { stockStatus } from '../lib/stock';
import { scaleQty } from '../lib/intensity';
import { StockDot } from './StockDot';
import { useHaveSet, usePantryLevels, usePantryQty } from './usePantry';
import { formatQty } from './labels';

// ===========================================================================
// Modalità cucina: passi a tutto schermo, un passo alla volta a caratteri
// grandi, con timer avviabile quando il passo dichiara dei minuti e schermo
// che non si spegne (Wake Lock). Pensata per cucinare con le mani sporche:
// bottoni grandi, niente menu.
// ===========================================================================

// Estrae i minuti dal testo del passo ("5 minuti", "3-4 min" → 4).
function minutesInStep(text: string): number | null {
  const m = text.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*min/i);
  return m ? parseInt(m[2] ?? m[1], 10) : null;
}

// Bip di fine timer senza file audio: due note brevi via WebAudio.
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
  } catch {
    // niente audio disponibile: resta la vibrazione/avviso visivo
  }
}

interface WakeLockSentinel {
  release: () => Promise<void>;
}

interface CookTimer {
  id: number;
  label: string;
  endsAt: number;
  done: boolean;
}

export function CookMode({
  recipe,
  factor,
  onClose,
}: {
  recipe: Recipe;
  factor: number;
  onClose: () => void;
}) {
  // step -1 = schermata ingredienti ("mise en place"), 0..n-1 = passi.
  const [step, setStep] = useState(-1);
  // Più timer simultanei (al prep day: farro in pentola E pollo in padella).
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const nextId = useRef(1);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  // Stato scorta per la mise en place (rosso = manca, ambra = sta per finire).
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const levels = usePantryLevels();

  // Schermo sempre acceso finché la modalità cucina è aperta.
  useEffect(() => {
    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
        };
        wakeLock.current = (await nav.wakeLock?.request('screen')) ?? null;
      } catch {
        wakeLock.current = null; // non supportato/negato: si cucina lo stesso
      }
    };
    request();
    // Il lock si perde quando l'app va in background: si riprende al ritorno.
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLock.current?.release().catch(() => {});
    };
  }, []);

  // Tick condiviso: i timer corrono anche fuori dal passo che li ha avviati
  // (i cereali cuociono mentre tu tagli le verdure del passo dopo).
  const anyRunning = timers.some((t) => !t.done);
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      setTimers((prev) => {
        const expired = prev.filter((t) => !t.done && ts >= t.endsAt);
        if (expired.length === 0) return prev;
        beep();
        navigator.vibrate?.([300, 150, 300]);
        return prev.map((t) => (ts >= t.endsAt ? { ...t, done: true } : t));
      });
    }, 250);
    return () => clearInterval(id);
  }, [anyRunning]);

  const startTimer = useCallback((minutes: number, label: string) => {
    setTimers((prev) => [
      ...prev,
      { id: nextId.current++, label, endsAt: Date.now() + minutes * 60000, done: false },
    ]);
  }, []);
  const removeTimer = useCallback((id: number) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const steps = recipe.steps;
  const stepMinutes = step >= 0 ? minutesInStep(steps[step]) : null;
  const stepLabel = `Passo ${step + 1}`;
  // Un timer per passo: se è già attivo per QUESTO passo, niente doppioni.
  const stepTimerRunning = timers.some((t) => t.label === stepLabel && !t.done);

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progressPct = step >= 0 ? Math.round(((step + 1) / steps.length) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--cream, #faf6ef)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 640,
        margin: '0 auto',
      }}
      role="dialog"
      aria-label={`Modalità cucina: ${recipe.name}`}
    >
      <div
        className="flex-between"
        style={{ padding: '12px 16px 8px', flex: '0 0 auto' }}
      >
        <b style={{ fontSize: '0.95rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <ChefHat size={16} className="ic" /> {recipe.name}
        </b>
        <button className="btn ghost" style={{ minHeight: 40, flex: '0 0 auto' }} onClick={onClose}>
          ✕ Esci
        </button>
      </div>

      <div
        aria-hidden="true"
        style={{ height: 5, background: 'var(--line)', margin: '0 16px 10px', borderRadius: 3, overflow: 'hidden', flex: '0 0 auto' }}
      >
        <div
          style={{ height: '100%', width: `${progressPct}%`, background: 'var(--olive)', transition: 'width .25s', borderRadius: 3 }}
        />
      </div>

      {timers.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            margin: '0 16px 10px',
            flex: '0 0 auto',
          }}
        >
          {timers.map((t) =>
            t.done ? (
              <button
                key={t.id}
                onClick={() => removeTimer(t.id)}
                className="banner warn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: 0,
                  padding: '8px 14px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  font: 'inherit',
                  fontWeight: 700,
                  animation: 'slideUp 0.18s ease-out',
                }}
                aria-label={`${t.label} finito: tocca per chiudere`}
              >
                <AlarmClock size={16} className="ic" /> {t.label} — finito! ✕
              </button>
            ) : (
              <span
                key={t.id}
                className="banner info"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: 0,
                  padding: '6px 8px 6px 14px',
                  borderRadius: 999,
                }}
              >
                <b style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.05rem' }}>
                  {fmt(t.endsAt - now)}
                </b>
                <span className="small">{t.label}</span>
                <button
                  onClick={() => removeTimer(t.id)}
                  aria-label={`Annulla timer ${t.label}`}
                  style={{
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: 999,
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                    fontSize: '0.85rem',
                  }}
                >
                  ✕
                </button>
              </span>
            ),
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {step === -1 ? (
          <>
            <p className="small muted">Prima di iniziare, metti tutto sul piano di lavoro:</p>
            <ul className="clean">
              {recipe.ingredients.map((ri, i) => {
                const ing = ingredientById(ri.ingredientId);
                return (
                  <li key={i} className="meal-row" style={{ fontSize: '1.05rem' }}>
                    <span className="grow">
                      {ing && !ing.staple && (
                        <StockDot level={stockStatus(ri.ingredientId, haveSet, qtyMap, levels)} />
                      )}
                      {ing ? ing.name : ri.ingredientId}
                    </span>
                    <span className="nowrap muted">
                      {formatQty(scaleQty(ri.qty, factor))} {ri.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <span className="pill olive" style={{ marginBottom: 10 }}>
              Passo {step + 1} di {steps.length}
            </span>
            <p style={{ fontSize: '1.35rem', lineHeight: 1.5, fontWeight: 500, marginTop: 10 }}>
              {steps[step]}
            </p>
            {stepMinutes != null && (
              <button
                className="btn block"
                style={{ marginTop: 14, fontSize: '1.05rem' }}
                onClick={() => startTimer(stepMinutes, stepLabel)}
                disabled={stepTimerRunning}
              >
                <Play size={16} className="ic" />{' '}
                {stepTimerRunning
                  ? `Timer del passo ${step + 1} già attivo`
                  : `Avvia timer ${stepMinutes} min (passo ${step + 1})`}
              </button>
            )}
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flex: '0 0 auto',
          padding: '12px 16px calc(14px + var(--safe-bottom, 0px))',
          background: 'var(--card)',
          borderTop: '1px solid var(--line)',
          boxShadow: '0 -2px 10px rgba(60, 50, 30, 0.08)',
        }}
      >
        <button
          className="btn secondary"
          style={{ flex: 1, minHeight: 52, fontSize: '1.05rem' }}
          onClick={() => setStep((s) => Math.max(-1, s - 1))}
          disabled={step === -1}
        >
          ‹ Indietro
        </button>
        {step < steps.length - 1 ? (
          <button
            className="btn"
            style={{ flex: 2, minHeight: 52, fontSize: '1.05rem' }}
            onClick={() => setStep((s) => s + 1)}
          >
            {step === -1 ? <><Play size={16} className="ic" /> Inizia a cucinare</> : 'Avanti ›'}
          </button>
        ) : (
          <button className="btn" style={{ flex: 2, minHeight: 52, fontSize: '1.05rem' }} onClick={onClose}>
            <Check size={16} className="ic" /> Finito, buon appetito!
          </button>
        )}
      </div>
    </div>
  );
}
