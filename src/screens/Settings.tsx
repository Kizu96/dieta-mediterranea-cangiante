import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Bell,
  CircleCheck,
  Download,
  Info,
  Link2,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import type { Season } from '../data/types';
import { addDays, toISODate } from '../lib/planning';
import { missingForDate } from '../lib/shopping';
import { exportData, importData } from '../lib/backup';
import { getSyncStatus, linkAccount, SYNC_EVENT, syncNow, unlinkAccount, type SyncStatus } from '../lib/sync';
import { db, getSetting, setSetting } from '../db/db';
import { isStoragePersisted } from '../lib/storage';
import { currentSeasonByDate } from '../lib/season';
import { Modal } from '../components/Modal';
import { useHaveSet, usePantryQty } from '../components/usePantry';
import { useVacation } from '../lib/vacation';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { INTENSITY_DESC } from '../lib/intensity';
import {
  DEFAULT_NOTIF_PREFS,
  getNotifPrefs,
  notificationsSupported,
  permissionStatus,
  requestPeriodicSync,
  requestPermission,
  saveNotifPrefs,
  scheduleAll,
  showNotification,
  type NotifPrefs,
} from '../lib/notifications';

const LAST_BACKUP_KEY = 'lastBackupAt';

export function Settings({
  season,
  seasonOverride,
  onSeasonOverride,
  onClose,
}: {
  season: Season;
  seasonOverride: Season | null;
  onSeasonOverride: (s: Season | null) => void;
  onClose: () => void;
}) {
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const { vacation, setVacation } = useVacation();
  const [vacFrom, setVacFrom] = useState('');
  const [vacTo, setVacTo] = useState('');
  const { intensity, factor, setIntensity } = useIntensity();
  const { includeExtra, setIncludeExtra } = useExtraRecipes();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [perm, setPerm] = useState<NotificationPermission>(permissionStatus());
  const [testMsg, setTestMsg] = useState('');
  const [dataMsg, setDataMsg] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoSeason = currentSeasonByDate();

  // --- Sincronizzazione cloud (gist privato GitHub) ---
  const [sync, setSync] = useState<SyncStatus>(() => getSyncStatus());
  const [token, setToken] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const refreshSync = () => setSync(getSyncStatus());

  const doLink = async () => {
    setSyncBusy(true);
    setSyncMsg('Collegamento in corso…');
    try {
      const r = await linkAccount(token);
      setToken('');
      setSyncMsg(`Collegato come ${r.login} ✓ — sincronizzazione attiva.`);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Errore di collegamento.');
    } finally {
      setSyncBusy(false);
      refreshSync();
    }
  };

  const doSyncNow = async () => {
    setSyncBusy(true);
    setSyncMsg('Sincronizzazione in corso…');
    try {
      const r = await syncNow();
      setSyncMsg(r.pulled ? 'Sincronizzato ✓ (dati aggiornati da un altro dispositivo)' : 'Sincronizzato ✓');
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Errore di sincronizzazione.');
    } finally {
      setSyncBusy(false);
      refreshSync();
    }
  };

  const doUnlink = () => {
    if (!confirm('Scollegare la sincronizzazione su questo dispositivo? I dati locali restano; il gist su GitHub non viene toccato.')) return;
    unlinkAccount();
    setSyncMsg('Scollegato da questo dispositivo.');
    refreshSync();
  };

  useEffect(() => {
    getNotifPrefs().then(setPrefs);
    getSetting<string | null>(LAST_BACKUP_KEY, null).then(setLastBackup);
    isStoragePersisted().then(setPersisted);
    // Lo stato sync si aggiorna anche quando una sincronizzazione di sfondo finisce.
    window.addEventListener(SYNC_EVENT, refreshSync);
    return () => window.removeEventListener(SYNC_EVENT, refreshSync);
  }, []);

  // Helper passato allo scheduler: domani mancano ingredienti?
  const hasMissingForTomorrow = () =>
    missingForDate(haveSet, addDays(new Date(), 1), season, includeExtra, undefined, qtyMap, factor)
      .length > 0;

  const applyPrefs = async (next: NotifPrefs) => {
    setPrefs(next);
    await saveNotifPrefs(next);
    await scheduleAll(next, { hasMissingForTomorrow });
  };

  const enableNotifications = async () => {
    const result = await requestPermission();
    setPerm(result);
    if (result === 'granted') {
      await requestPeriodicSync(); // best-effort, può fallire silenziosamente
      await applyPrefs({ ...prefs, enabled: true });
    }
  };

  const sendTest = async () => {
    const ok = await showNotification(
      'Notifica di test',
      'Le notifiche funzionano! 🎉 Riceverai i promemoria mentre l’app è aperta.',
    );
    setTestMsg(ok ? 'Inviata!' : 'Impossibile inviare (controlla i permessi).');
    setTimeout(() => setTestMsg(''), 3000);
  };

  const set = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) =>
    applyPrefs({ ...prefs, [key]: value });

  const doExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dieta-backup-${toISODate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const today = toISODate(new Date());
    await setSetting(LAST_BACKUP_KEY, today);
    setLastBackup(today);
    setDataMsg('Backup esportato ✓');
    setTimeout(() => setDataMsg(''), 4000);
  };

  const doImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!confirm('Importare il backup? I dati attuali verranno sostituiti.')) return;
      await importData(parsed);
      setDataMsg('Backup importato ✓');
    } catch {
      setDataMsg('File non valido.');
    }
    setTimeout(() => setDataMsg(''), 4000);
  };

  const resetData = async () => {
    if (!confirm('Eliminare TUTTI i dati locali (dispensa, spesa, peso, log)? Operazione irreversibile.'))
      return;
    await Promise.all([
      db.pantry.clear(),
      db.shopping.clear(),
      db.weights.clear(),
      db.essentials.clear(),
      db.workouts.clear(),
      db.settings.clear(),
    ]);
    onSeasonOverride(null);
    onClose();
  };

  const now = useMemo(() => new Date(), []);
  const daysSinceBackup =
    lastBackup != null
      ? Math.floor((now.getTime() - new Date(lastBackup).getTime()) / 86_400_000)
      : null;
  const backupStale = daysSinceBackup == null || daysSinceBackup >= 14;

  return (
    <Modal title="Impostazioni" onClose={onClose}>
      {/* Stagione */}
      <h3 className="section-label">Stagione del menù</h3>
      <p className="small muted" style={{ marginTop: -4 }}>
        Automatica in base al mese ({autoSeason}). Puoi forzarla.
      </p>
      <div className="segmented">
        <button
          className={seasonOverride === null ? 'active' : ''}
          onClick={() => onSeasonOverride(null)}
        >
          Auto
        </button>
        <button
          className={seasonOverride === 'estate' ? 'active' : ''}
          onClick={() => onSeasonOverride('estate')}
        >
          Estate
        </button>
        <button
          className={seasonOverride === 'inverno' ? 'active' : ''}
          onClick={() => onSeasonOverride('inverno')}
        >
          Inverno
        </button>
      </div>

      {/* Intensità */}
      <h3 className="section-label">Intensità della dieta</h3>
      <div className="segmented">
        <button
          className={intensity === 'moderata' ? 'active' : ''}
          onClick={() => setIntensity('moderata')}
        >
          Moderata
        </button>
        <button
          className={intensity === 'intensiva' ? 'active' : ''}
          onClick={() => setIntensity('intensiva')}
        >
          Intensiva
        </button>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>
        {INTENSITY_DESC[intensity]}
      </p>

      {/* Ricette extra (prodotti speciali + frullatore) */}
      <h3 className="section-label">Ricette con prodotti speciali</h3>
      <div className="card" style={{ padding: 12 }}>
        <div className="flex-between">
          <div className="grow">
            <b>Includi ricette extra</b>
            <div className="small muted">
              Frullato verde (frullatore), matcha, germogli da coltivare e tahin: richiedono
              prodotti che spesso si comprano online.
            </div>
          </div>
          <button
            className={includeExtra ? 'btn' : 'btn ghost'}
            style={{ minHeight: 38, padding: '0 14px' }}
            onClick={() => setIncludeExtra(!includeExtra)}
          >
            {includeExtra ? 'On' : 'Off'}
          </button>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>
        {includeExtra
          ? 'Attive: piano, «compra per domani» e lista della spesa includono frullato verde, matcha, germogli e tahin.'
          : 'Disattivate: il piano usa solo ingredienti da supermercato (niente frullatore né prodotti da ordinare). Comodo finché non li hai comprati.'}
      </p>

      {/* Vacanza */}
      <h3 className="section-label">Modalità vacanza</h3>
      {vacation ? (
        <>
          <p className="small" style={{ marginTop: -4 }}>
            🏖️ Attiva dal <b>{vacation.from}</b> al <b>{vacation.to}</b>: niente avvisi
            spesa/frigo/prep, lista del piano in pausa, lo streak non si rompe.
          </p>
          <button className="btn ghost block" onClick={() => setVacation(null)}>
            Termina la vacanza
          </button>
        </>
      ) : (
        <>
          <p className="small muted" style={{ marginTop: -4 }}>
            Parti qualche giorno? L'app mette in pausa avvisi e lista spesa, e non conta i
            giorni come saltati. (Impostala su ogni dispositivo: non si sincronizza.)
          </p>
          <div className="row">
            <div className="field">
              <label htmlFor="vac-from">Dal</label>
              <input id="vac-from" type="date" value={vacFrom} onChange={(e) => setVacFrom(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="vac-to">Al</label>
              <input id="vac-to" type="date" value={vacTo} min={vacFrom || undefined} onChange={(e) => setVacTo(e.target.value)} />
            </div>
          </div>
          <button
            className="btn block"
            disabled={!vacFrom || !vacTo || vacTo < vacFrom}
            onClick={() => setVacation({ from: vacFrom, to: vacTo })}
          >
            🏖️ Attiva la modalità vacanza
          </button>
        </>
      )}

      {/* Notifiche */}
      <h3 className="section-label">Promemoria locali</h3>
      {!notificationsSupported() ? (
        <p className="small muted">Questo dispositivo/browser non supporta le notifiche.</p>
      ) : perm !== 'granted' ? (
        <>
          <p className="small muted" style={{ marginTop: -4 }}>
            Attiva i promemoria per spesa, allenamento e pesata.
          </p>
          <button className="btn block" onClick={enableNotifications}>
            <Bell size={16} className="ic" /> Attiva le notifiche
          </button>
          {perm === 'denied' && (
            <p className="small" style={{ color: 'var(--danger)' }}>
              Permesso negato: abilitalo dalle impostazioni del browser/sistema.
            </p>
          )}
        </>
      ) : (
        <>
          <ReminderToggle
            label="Spesa serale"
            hint="Solo se mancano ingredienti per domani."
            enabled={prefs.spesaEnabled}
            time={prefs.spesaTime}
            onToggle={(v) => set('spesaEnabled', v)}
            onTime={(t) => set('spesaTime', t)}
          />
          <ReminderToggle
            label="Allenamento"
            hint="Promemoria all’orario scelto."
            enabled={prefs.allenamentoEnabled}
            time={prefs.allenamentoTime}
            onToggle={(v) => set('allenamentoEnabled', v)}
            onTime={(t) => set('allenamentoTime', t)}
          />
          <ReminderToggle
            label="Pesata del mattino"
            hint="Ricordati di pesarti a digiuno."
            enabled={prefs.pesataEnabled}
            time={prefs.pesataTime}
            onToggle={(v) => set('pesataEnabled', v)}
            onTime={(t) => set('pesataTime', t)}
          />

          <button className="btn secondary block" onClick={sendTest} style={{ marginTop: 8 }}>
            Invia notifica di test
          </button>
          {testMsg && (
            <p className="small center" style={{ color: 'var(--olive-dark)' }}>
              {testMsg}
            </p>
          )}

          <div className="banner info" style={{ marginTop: 10 }}>
            <Info size={15} className="ic" /> Senza un server i promemoria scattano solo mentre l’app è aperta. Tieni la PWA
            installata e aperta in background per maggiore affidabilità.
          </div>
        </>
      )}

      {/* Sincronizzazione cloud */}
      <h3 className="section-label">Sincronizzazione (telefono ↔ PC)</h3>
      {!sync.enabled ? (
        <>
          <p className="small muted" style={{ marginTop: -4 }}>
            Tieni allineati telefono e PC tramite un <b>gist privato</b> nel tuo account GitHub
            (gratis, i dati restano nel tuo account). Sincronizza dispensa, spesa, peso, essentials e
            allenamenti — non le impostazioni, che restano per dispositivo.
          </p>
          <ol className="small" style={{ marginTop: 0, paddingLeft: 18 }}>
            <li>
              Crea un token con il solo permesso «gist»:{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Dieta%20Mediterranea%20Cangiante"
                target="_blank"
                rel="noreferrer"
              >
                apri GitHub
              </a>{' '}
              → in fondo «Generate token» → copialo.
            </li>
            <li>Incollalo qui sotto e premi «Collega».</li>
            <li>Sull’altro dispositivo: stesso token → ritrova da solo i tuoi dati.</li>
          </ol>
          <div className="field">
            <label>Token GitHub (scope «gist»)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button className="btn block" onClick={doLink} disabled={syncBusy || !token.trim()}>
            <Link2 size={16} className="ic" /> Collega e sincronizza
          </button>
          <div className="banner info" style={{ marginTop: 10 }}>
            <Lock size={15} className="ic" /> Il token resta <b>solo su questo dispositivo</b> e viene usato solo con GitHub. Non
            inserirlo mai in chat o in altri siti.
          </div>
        </>
      ) : (
        <>
          <p className="small" style={{ marginTop: -4 }}>
            <CircleCheck size={15} className="ic" style={{ color: 'var(--ok)' }} /> Attiva{sync.login ? ` — account ${sync.login}` : ''}.{' '}
            {sync.hasGist ? 'Archivio collegato.' : 'Archivio in creazione…'}
          </p>
          <p className="small muted" style={{ marginTop: 0 }}>
            Ultima sincronizzazione:{' '}
            <b>{sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString('it-IT') : 'mai'}</b>
          </p>
          {sync.lastError && (
            <div className="banner warn" style={{ marginTop: 6 }}>
              <TriangleAlert size={15} className="ic" /> Ultimo errore: {sync.lastError}
            </div>
          )}
          <button className="btn block" onClick={doSyncNow} disabled={syncBusy} style={{ marginBottom: 8 }}>
            <RefreshCw size={16} className="ic" /> Sincronizza ora
          </button>
          <button
            className="btn ghost block"
            onClick={doUnlink}
            disabled={syncBusy}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Scollega questo dispositivo
          </button>
        </>
      )}
      {syncMsg && (
        <p className="small center" style={{ color: 'var(--olive-dark)' }}>
          {syncMsg}
        </p>
      )}

      {/* Dati */}
      <h3 className="section-label">Dati e backup</h3>
      <p className="small muted" style={{ marginTop: -4 }}>
        Tutti i dati restano solo su questo dispositivo (nessun account, nessun cloud). Gli
        aggiornamenti dell’app non li cancellano, ma fai un backup ogni tanto: ti serve per cambiare
        dispositivo, se il browser libera spazio o se cambia l’indirizzo del sito.
      </p>
      <p className="small" style={{ marginTop: 0 }}>
        <Shield size={14} className="ic" /> Protezione anti-cancellazione: <b>{persisted ? 'attiva' : 'non garantita'}</b>
        {' · '}Ultimo backup:{' '}
        <b>{lastBackup ? `${lastBackup}${daysSinceBackup ? ` (${daysSinceBackup} gg fa)` : ' (oggi)'}` : 'mai'}</b>
      </p>
      {backupStale && (
        <div className="banner warn" style={{ marginTop: 6 }}>
          <Save size={15} className="ic" /> {lastBackup ? 'È passato un po’ dall’ultimo backup.' : 'Non hai ancora fatto un backup.'}{' '}
          Esporta i dati e conserva il file (così non perdi nulla quando torneremo su Netlify).
        </div>
      )}
      <button className="btn secondary block" onClick={doExport} style={{ marginBottom: 8 }}>
        <Download size={16} className="ic" /> Esporta dati (backup)
      </button>
      <button
        className="btn secondary block"
        onClick={() => fileRef.current?.click()}
        style={{ marginBottom: 8 }}
      >
        <Upload size={16} className="ic" /> Importa backup
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={doImport} style={{ display: 'none' }} />
      {dataMsg && (
        <p className="small center" style={{ color: 'var(--olive-dark)' }}>
          {dataMsg}
        </p>
      )}
      <button className="btn ghost block" onClick={resetData} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 8 }}>
        <Trash2 size={16} className="ic" /> Cancella tutti i dati locali
      </button>

      <p className="small muted center" style={{ marginTop: 14, marginBottom: 0 }}>
        Versione app (build): {new Date(__BUILD_DATE__).toLocaleString('it-IT')}
        <br />
        Se è vecchia: chiudi del tutto l’app e riaprila due volte.
      </p>
    </Modal>
  );
}

function ReminderToggle({
  label,
  hint,
  enabled,
  time,
  onToggle,
  onTime,
}: {
  label: string;
  hint: string;
  enabled: boolean;
  time: string;
  onToggle: (v: boolean) => void;
  onTime: (t: string) => void;
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="flex-between">
        <div className="grow">
          <b>{label}</b>
          <div className="small muted">{hint}</div>
        </div>
        <button
          className={enabled ? 'btn' : 'btn ghost'}
          style={{ minHeight: 38, padding: '0 14px' }}
          onClick={() => onToggle(!enabled)}
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>
      {enabled && (
        <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
          <label>Orario</label>
          <input type="time" value={time} onChange={(e) => onTime(e.target.value)} />
        </div>
      )}
    </div>
  );
}
