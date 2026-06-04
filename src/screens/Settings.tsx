import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Season } from '../data/types';
import { addDays, toISODate } from '../lib/planning';
import { missingForDate } from '../lib/shopping';
import { exportData, importData } from '../lib/backup';
import { db } from '../db/db';
import { currentSeasonByDate } from '../lib/season';
import { Modal } from '../components/Modal';
import { useHaveSet } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
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
  const { intensity, setIntensity } = useIntensity();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [perm, setPerm] = useState<NotificationPermission>(permissionStatus());
  const [testMsg, setTestMsg] = useState('');
  const [dataMsg, setDataMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const autoSeason = currentSeasonByDate();

  useEffect(() => {
    getNotifPrefs().then(setPrefs);
  }, []);

  // Helper passato allo scheduler: domani mancano ingredienti?
  const hasMissingForTomorrow = () =>
    missingForDate(haveSet, addDays(new Date(), 1), season).length > 0;

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
            🔔 Attiva le notifiche
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
            ℹ️ Senza un server i promemoria scattano solo mentre l’app è aperta. Tieni la PWA
            installata e aperta in background per maggiore affidabilità.
          </div>
        </>
      )}

      {/* Dati */}
      <h3 className="section-label">Dati</h3>
      <p className="small muted" style={{ marginTop: -4 }}>
        Tutti i dati restano solo su questo dispositivo (nessun account, nessun cloud). Fai un
        backup ogni tanto, soprattutto prima di cambiare telefono o svuotare la cache.
      </p>
      <button className="btn secondary block" onClick={doExport} style={{ marginBottom: 8 }}>
        ⬇️ Esporta dati (backup)
      </button>
      <button
        className="btn secondary block"
        onClick={() => fileRef.current?.click()}
        style={{ marginBottom: 8 }}
      >
        ⬆️ Importa backup
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={doImport} style={{ display: 'none' }} />
      {dataMsg && (
        <p className="small center" style={{ color: 'var(--olive-dark)' }}>
          {dataMsg}
        </p>
      )}
      <button className="btn ghost block" onClick={resetData} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 8 }}>
        🗑 Cancella tutti i dati locali
      </button>
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
