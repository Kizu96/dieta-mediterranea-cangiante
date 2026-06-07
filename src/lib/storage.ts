// Persistenza dei dati locali: chiede al browser di NON cancellare l'IndexedDB
// per liberare spazio (eviction). Senza questo, dati come dispensa/peso possono
// essere rimossi automaticamente sotto pressione di memoria, soprattutto su mobile.

/** Richiede storage persistente. Ritorna true se i dati sono protetti dall'eviction. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!('storage' in navigator) || !navigator.storage.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Stato attuale (senza richiederlo di nuovo), per mostrarlo nelle Impostazioni. */
export async function isStoragePersisted(): Promise<boolean> {
  try {
    return !!navigator.storage?.persisted && (await navigator.storage.persisted());
  } catch {
    return false;
  }
}
