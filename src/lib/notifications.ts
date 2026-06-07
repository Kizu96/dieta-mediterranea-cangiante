// ===========================================================================
// Notifiche LOCALI (nessun server / nessun push).
//
// LIMITI ONESTI:
//  - Senza un backend non esiste consegna push affidabile in background.
//  - Usiamo la Notification API + setTimeout: i promemoria scattano SOLO mentre
//    l'app (o la sua scheda/PWA) è aperta. Se l'app è chiusa, il setTimeout muore.
//  - Dove disponibile (Chrome/Android installato come PWA) tentiamo la
//    Periodic Background Sync API per un "best effort" in background; non è
//    garantita e richiede installazione + permessi. Vedi requestPeriodicSync().
//  - Su iOS le notifiche web sono molto limitate; qui il target è Android + Windows.
// ===========================================================================
import { getSetting, setSetting } from '../db/db';

export interface NotifPrefs {
  enabled: boolean;
  // Orari in formato "HH:MM"
  spesaTime: string; // promemoria spesa serale (solo se mancano cose per domani)
  spesaEnabled: boolean;
  allenamentoTime: string;
  allenamentoEnabled: boolean;
  pesataTime: string;
  pesataEnabled: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  enabled: false,
  spesaTime: '21:00',
  spesaEnabled: true,
  allenamentoTime: '18:30',
  allenamentoEnabled: true,
  pesataTime: '07:30',
  pesataEnabled: true,
};

export const NOTIF_PREFS_KEY = 'notifPrefs';

export async function getNotifPrefs(): Promise<NotifPrefs> {
  const saved = await getSetting<Partial<NotifPrefs>>(NOTIF_PREFS_KEY, {});
  return { ...DEFAULT_NOTIF_PREFS, ...saved };
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await setSetting(NOTIF_PREFS_KEY, prefs);
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionStatus(): NotificationPermission {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

/** Chiede il permesso di notifica all'utente. Ritorna lo stato finale. */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Mostra immediatamente una notifica (usata anche dal pulsante "notifica di test"). */
export async function showNotification(title: string, body: string): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    // Se c'è un service worker, preferiamo quella API (più affidabile su Android).
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}icon.svg`,
          badge: `${import.meta.env.BASE_URL}icon.svg`,
        });
        return true;
      }
    }
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icon.svg` });
    return true;
  } catch {
    return false;
  }
}

// --- Scheduler in-app (mentre l'app è aperta) -----------------------------
// Mantiene un timer per ciascun promemoria attivo. I timer vengono ricreati
// ogni volta che si chiama scheduleAll() (es. al cambio impostazioni o all'avvio).

type TimerHandle = ReturnType<typeof setTimeout>;
const timers = new Map<string, TimerHandle>();

function clearTimers(): void {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

/** Millisecondi dal momento attuale fino al prossimo orario "HH:MM" (oggi o domani). */
function msUntil(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const now = new Date();
  const next = new Date();
  next.setHours(h || 0, m || 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export interface ScheduleHooks {
  // Ritorna true se domani mancano ingredienti (per la spesa serale).
  hasMissingForTomorrow: () => Promise<boolean> | boolean;
}

/**
 * Pianifica i promemoria abilitati per il prossimo orario utile.
 * Si auto-ripianifica dopo ogni scatto (per i giorni successivi).
 * NB: funziona solo finché l'app resta aperta.
 */
export async function scheduleAll(prefs: NotifPrefs, hooks: ScheduleHooks): Promise<void> {
  clearTimers();
  if (!prefs.enabled || permissionStatus() !== 'granted') return;

  const arm = (
    key: string,
    time: string,
    fire: () => void | Promise<void>,
  ) => {
    const delay = msUntil(time);
    const t = setTimeout(async () => {
      await fire();
      // Ripianifica per il giorno seguente.
      arm(key, time, fire);
    }, delay);
    timers.set(key, t);
  };

  if (prefs.spesaEnabled) {
    arm('spesa', prefs.spesaTime, async () => {
      const missing = await hooks.hasMissingForTomorrow();
      if (missing) {
        await showNotification(
          'Spesa per domani',
          'Mancano ingredienti per i pasti di domani. Apri la Lista spesa.',
        );
      }
    });
  }
  if (prefs.allenamentoEnabled) {
    arm('allenamento', prefs.allenamentoTime, async () => {
      await showNotification('Allenamento', 'È l’ora del tuo allenamento di oggi. Forza!');
    });
  }
  if (prefs.pesataEnabled) {
    arm('pesata', prefs.pesataTime, async () => {
      await showNotification('Pesata del mattino', 'Pesati a digiuno e registra il peso di oggi.');
    });
  }
}

export function cancelAll(): void {
  clearTimers();
}

/**
 * Tentativo "best effort" di registrare una Periodic Background Sync.
 * Disponibile solo su alcuni browser (Chrome/Android, PWA installata) e mai
 * garantita dal sistema operativo. È un di più: l'affidabilità reale resta
 * quella dei promemoria in-app sopra.
 */
export async function requestPeriodicSync(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    // periodicSync non è tipizzato in TS: accesso difensivo.
    const anyReg = reg as unknown as {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!anyReg.periodicSync) return false;
    const status = await (
      navigator as unknown as { permissions: Permissions }
    ).permissions.query({
      // @ts-expect-error 'periodic-background-sync' non è nei tipi standard
      name: 'periodic-background-sync',
    });
    if (status.state !== 'granted') return false;
    await anyReg.periodicSync.register('promemoria-dieta', {
      minInterval: 12 * 60 * 60 * 1000, // ~12h
    });
    return true;
  } catch {
    return false;
  }
}
