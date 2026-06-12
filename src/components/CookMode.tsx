import { useCallback, useEffect, useRef, useState } from 'react';
import type { Recipe } from '../data/types';
import { ingredientById } from '../lib/shopping';
import { scaleQty } from '../lib/intensity';
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
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [timerLabel, setTimerLabel] = useState('');
  const [timerDone, setTimerDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const wakeLock = useRef<WakeLockSentinel | null>(null);

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

  // Tick del timer (anche fuori dal passo che l'ha avviato: i cereali cuociono
  // mentre tu passi al taglio delle verdure).
  useEffect(() => {
    if (timerEnd == null) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= timerEnd) {
        setTimerEnd(null);
        setTimerDone(true);
        beep();
        navigator.vibrate?.([300, 150, 300]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [timerEnd]);

  const startTimer = useCallback((minutes: number, label: string) => {
    setTimerEnd(Date.now() + minutes * 60000);
    setTimerLabel(label);
    setTimerDone(false);
  }, []);

  const steps = recipe.steps;
  const stepMinutes = step >= 0 ? minutesInStep(steps[step]) : null;
  const remaining = timerEnd != null ? Math.max(0, timerEnd - now) : 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--cream, #faf6ef)',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        overflowY: 'auto',
      }}
      role="dialog"
      aria-label={`Modalità cucina: ${recipe.name}`}
    >
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <b style={{ fontSize: '0.95rem' }}>👨‍🍳 {recipe.name}</b>
        <button className="btn ghost" style={{ minHeight: 40 }} onClick={onClose}>
          ✕ Esci
        </button>
      </div>

      {(timerEnd != null || timerDone) && (
        <div
          className={timerDone ? 'banner warn' : 'banner info'}
          style={{ marginBottom: 10 }}
          onClick={() => timerDone && setTimerDone(false)}
        >
          {timerDone ? (
            <b>⏰ Tempo scaduto! ({timerLabel}) — tocca per chiudere</b>
          ) : (
            <>
              ⏱ <b>
                {mm}:{String(ss).padStart(2, '0')}
              </b>{' '}
              · {timerLabel}{' '}
              <button
                className="btn ghost"
                style={{ minHeight: 32, marginLeft: 8 }}
                onClick={() => setTimerEnd(null)}
              >
                annulla
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1 }}>
        {step === -1 ? (
          <>
            <p className="small muted">Prima di iniziare, metti tutto sul piano di lavoro:</p>
            <ul className="clean">
              {recipe.ingredients.map((ri, i) => {
                const ing = ingredientById(ri.ingredientId);
                return (
                  <li key={i} className="meal-row" style={{ fontSize: '1.05rem' }}>
                    <span className="grow">{ing ? ing.name : ri.ingredientId}</span>
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
            <p className="small muted" style={{ marginBottom: 6 }}>
              Passo {step + 1} di {steps.length}
            </p>
            <p style={{ fontSize: '1.35rem', lineHeight: 1.5, fontWeight: 500 }}>{steps[step]}</p>
            {stepMinutes != null && (
              <button
                className="btn block"
                style={{ marginTop: 14, fontSize: '1.05rem' }}
                onClick={() => startTimer(stepMinutes, `passo ${step + 1}`)}
                disabled={timerEnd != null}
              >
                ▶ Avvia timer {stepMinutes} min
              </button>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 12 }}>
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
            {step === -1 ? '▶ Inizia a cucinare' : 'Avanti ›'}
          </button>
        ) : (
          <button className="btn" style={{ flex: 2, minHeight: 52, fontSize: '1.05rem' }} onClick={onClose}>
            ✅ Finito, buon appetito!
          </button>
        )}
      </div>
    </div>
  );
}
