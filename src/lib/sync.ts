// ===========================================================================
// Sincronizzazione cloud opzionale tramite un GIST PRIVATO di GitHub.
//
// Perché un gist: l'utente ha già un account GitHub (l'app è ospitata lì) e
// diffida dei database SaaS di terzi. Un gist privato tiene i dati nel SUO
// account, è gratis e non richiede backend. L'app fa pull+merge+push quando si
// apre e quando torna in primo piano, così telefono e PC restano allineati.
//
// Sicurezza: serve un Personal Access Token con il solo scope `gist`. È salvato
// SOLO in localStorage su questo dispositivo, non finisce mai nel backup né nel
// gist, e viene inviato unicamente ad api.github.com.
//
// Cosa si sincronizza: i DATI (dispensa, spesa, peso/misure, essentials,
// allenamenti). NON le impostazioni (stagione, intensità, orari notifiche):
// quelle restano per-dispositivo apposta.
// ===========================================================================
import {
  exportData,
  importData,
  mergeBackup,
  canonicalString,
  type BackupData,
} from './backup';

const API = 'https://api.github.com';
const SYNC_FILENAME = 'dieta-mediterranea-cangiante-sync.json';
const GIST_DESCRIPTION = 'Dieta Mediterranea Cangiante — dati sincronizzati (privato)';

const LS = {
  token: 'sync.token',
  gistId: 'sync.gistId',
  enabled: 'sync.enabled',
  login: 'sync.login',
  lastSyncAt: 'sync.lastSyncAt',
  lastError: 'sync.lastError',
} as const;

// --- Config (localStorage) -------------------------------------------------
const get = (k: string) => localStorage.getItem(k);
const set = (k: string, v: string | null) =>
  v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);

export interface SyncStatus {
  enabled: boolean;
  login: string | null;
  hasGist: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

export function getSyncStatus(): SyncStatus {
  return {
    enabled: get(LS.enabled) === '1',
    login: get(LS.login),
    hasGist: !!get(LS.gistId),
    lastSyncAt: get(LS.lastSyncAt),
    lastError: get(LS.lastError),
  };
}

export const isSyncEnabled = () => get(LS.enabled) === '1';

// --- GitHub REST API -------------------------------------------------------
function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return `GitHub: ${j.message || res.status}`;
  } catch {
    return `GitHub: ${res.status}`;
  }
}

async function ghUser(token: string): Promise<string> {
  const res = await fetch(`${API}/user`, { headers: ghHeaders(token) });
  if (res.status === 401) throw new Error('Token non valido o scaduto.');
  if (!res.ok) throw new Error(await ghError(res));
  return (await res.json()).login as string;
}

async function findGist(token: string): Promise<string | null> {
  const res = await fetch(`${API}/gists?per_page=100`, { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(await ghError(res));
  const list: Array<{ id: string; files?: Record<string, unknown> }> = await res.json();
  for (const g of list) if (g.files && SYNC_FILENAME in g.files) return g.id;
  return null;
}

async function createGist(token: string, content: string): Promise<string> {
  const res = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [SYNC_FILENAME]: { content } },
    }),
  });
  if (!res.ok) throw new Error(await ghError(res));
  return (await res.json()).id as string;
}

async function readGist(token: string, id: string): Promise<Partial<BackupData> | null> {
  const res = await fetch(`${API}/gists/${id}`, { headers: ghHeaders(token) });
  if (res.status === 404) return null; // gist eliminato a mano → ne ricreeremo uno
  if (!res.ok) throw new Error(await ghError(res));
  const json = await res.json();
  const file = json.files?.[SYNC_FILENAME];
  if (!file) return null;
  let content: string = file.content ?? '';
  if (file.truncated && file.raw_url) content = await (await fetch(file.raw_url)).text();
  if (!content) return null;
  try {
    return JSON.parse(content) as Partial<BackupData>;
  } catch {
    return null;
  }
}

async function writeGist(token: string, id: string, content: string): Promise<void> {
  const res = await fetch(`${API}/gists/${id}`, {
    method: 'PATCH',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [SYNC_FILENAME]: { content } } }),
  });
  if (!res.ok) throw new Error(await ghError(res));
}

// --- Orchestrazione --------------------------------------------------------
export interface SyncResult {
  login: string;
  pulled: boolean; // ha cambiato i dati locali
  pushed: boolean; // ha aggiornato il gist
}

let inFlight: Promise<SyncResult> | null = null;

async function doSync(): Promise<SyncResult> {
  const token = get(LS.token);
  if (!token) throw new Error('Token mancante.');

  const login = await ghUser(token);
  set(LS.login, login);

  // I dati locali, senza le impostazioni (non vanno sincronizzate).
  const local: Partial<BackupData> = { ...(await exportData()), settings: undefined };

  let gistId = get(LS.gistId);
  if (!gistId) {
    gistId = await findGist(token); // su un secondo dispositivo lo ritrova da solo
    if (gistId) set(LS.gistId, gistId);
  }

  let pulled = false;
  let pushed = false;

  if (!gistId) {
    // Primo avvio assoluto: crea il gist con i dati locali.
    const merged = mergeBackup(local, {});
    gistId = await createGist(token, JSON.stringify(merged, null, 2));
    set(LS.gistId, gistId);
    pushed = true;
  } else {
    const remote = await readGist(token, gistId);
    const merged = mergeBackup(local, remote ?? {});
    const mergedC = canonicalString(merged);

    if (mergedC !== canonicalString(local)) {
      await importData(merged); // merged.settings assente ⇒ le impostazioni restano intatte
      pulled = true;
    }
    if (!remote || mergedC !== canonicalString(remote)) {
      await writeGist(token, gistId, JSON.stringify(merged, null, 2));
      pushed = true;
    }
  }

  set(LS.lastSyncAt, new Date().toISOString());
  set(LS.lastError, null);
  return { login, pulled, pushed };
}

/** Esegue una sincronizzazione completa (pull + merge + push), una alla volta. */
export function syncNow(): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = doSync()
    .catch((e) => {
      set(LS.lastError, e instanceof Error ? e.message : String(e));
      throw e;
    })
    .finally(() => {
      inFlight = null;
    }) as Promise<SyncResult>;
  return inFlight;
}

/** Sincronizzazione "di sfondo" (avvio/ritorno in primo piano): non lancia errori. */
export async function syncInBackground(): Promise<void> {
  if (!isSyncEnabled()) return;
  try {
    await syncNow();
  } catch {
    /* silenzioso: l'errore resta in getSyncStatus().lastError per le Impostazioni */
  }
}

/** Collega l'account: valida il token, attiva la sync e fa la prima sincronizzazione. */
export async function linkAccount(token: string): Promise<SyncResult> {
  const t = token.trim();
  if (!t) throw new Error('Inserisci un token.');
  const login = await ghUser(t); // valida subito; se fallisce non salviamo nulla
  set(LS.token, t);
  set(LS.login, login);
  set(LS.enabled, '1');
  return syncNow();
}

/** Scollega: rimuove token e riferimenti locali. Il gist su GitHub resta (puoi cancellarlo a mano). */
export function unlinkAccount(): void {
  for (const k of Object.values(LS)) set(k, null);
}
