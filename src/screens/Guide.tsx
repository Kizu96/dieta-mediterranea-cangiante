import { useState } from 'react';
import { guideSections } from '../data/guide';
import { Card } from '../components/Card';
import { Markdown } from '../components/Markdown';

export function Guide() {
  // Sezione aperta (accordion). Prima aperta di default se presente.
  const [open, setOpen] = useState<string | null>(guideSections[0]?.id ?? null);

  return (
    <div>
      <Card title="Guida" icon="📖">
        <p className="small muted" style={{ marginTop: -4 }}>
          Tutto ciò che serve: germogli, fermentati, conservazione, scienza e fonti.
        </p>
        <a className="btn terracotta block" href="/Guida-Dieta.pdf" download>
          ⬇️ Scarica la guida in PDF
        </a>
        <p className="small muted center" style={{ marginTop: 8, marginBottom: 0 }}>
          Il PDF si apre/scarica se il file è disponibile.
        </p>
      </Card>

      {guideSections.length === 0 ? (
        <div className="empty">
          <span className="emoji">📖</span>
          Guide in arrivo.
        </div>
      ) : (
        guideSections.map((s) => {
          const isOpen = open === s.id;
          return (
            <Card key={s.id} flush>
              <button
                className="check-row"
                style={{ borderBottom: isOpen ? '1px solid var(--line)' : 'none' }}
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
              >
                <span className="check-main">
                  <span className="check-title">
                    {s.icon ? `${s.icon} ` : ''}
                    {s.title}
                  </span>
                </span>
                <span aria-hidden="true" className="muted">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '4px 14px 14px' }}>
                  <Markdown source={s.body} />
                </div>
              )}
            </Card>
          );
        })
      )}

      <div className="banner info">
        ⚕️ <b>Disclaimer:</b> contenuti educativi, non sostituiscono il parere di un medico o
        nutrizionista. In caso di patologie, terapie o dubbi, consulta un professionista.
      </div>
    </div>
  );
}
