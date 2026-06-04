import { useEffect, useRef, type ReactNode } from 'react';

// Foglio modale (bottom-sheet su mobile, dialog centrato su desktop).
// Si chiude col tasto/gesto "Indietro" e con Esc; blocca lo scroll dietro.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  const closedByPop = useRef(false);

  // Tiene il ref allineato all'ultima onClose senza scriverlo durante il render.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Aggiunge una voce di cronologia: "Indietro"/swipe-back chiude la modale
    // invece di uscire dall'app (fix navigazione su mobile/PWA).
    history.pushState({ modal: true }, '');
    const onPop = () => {
      closedByPop.current = true;
      onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // Chiusa dalla UI (non dal tasto Indietro): rimuovo la voce di cronologia aggiunta.
      if (!closedByPop.current) history.back();
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
