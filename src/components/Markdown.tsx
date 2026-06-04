import { Fragment, type ReactNode } from 'react';

// Renderer markdown minimale (nessuna dipendenza esterna).
// Supporta: titoli (#, ##, ###), grassetto (**...**), corsivo (*...*),
// liste puntate (-, *), liste numerate (1.), citazioni (>), paragrafi.

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Tokenizza **grassetto** e *corsivo*.
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      out.push(<strong key={`${keyBase}-b${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={`${keyBase}-i${i}`}>{m[3]}</em>);
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { type: 'h'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
  };
  const flushUl = () => {
    if (ul.length) {
      blocks.push({ type: 'ul', items: ul });
      ul = [];
    }
  };
  const flushOl = () => {
    if (ol.length) {
      blocks.push({ type: 'ol', items: ol });
      ol = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ type: 'quote', text: quote.join(' ') });
      quote = [];
    }
  };
  const flushAll = () => {
    flushPara();
    flushUl();
    flushOl();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      flushAll();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      blocks.push({ type: 'h', level: h[1].length, text: h[2] });
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      flushUl();
      flushOl();
      quote.push(line.replace(/^>\s?/, ''));
      continue;
    }
    const olm = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (olm) {
      flushPara();
      flushUl();
      flushQuote();
      ol.push(olm[1]);
      continue;
    }
    const ulm = /^[-*]\s+(.*)$/.exec(line.trim());
    if (ulm) {
      flushPara();
      flushOl();
      flushQuote();
      ul.push(ulm[1]);
      continue;
    }
    // Paragrafo normale.
    flushUl();
    flushOl();
    flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return blocks;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="md">
      {blocks.map((b, idx) => {
        const key = `b${idx}`;
        switch (b.type) {
          case 'h':
            if (b.level === 1) return <h2 key={key}>{renderInline(b.text, key)}</h2>;
            if (b.level === 2) return <h3 key={key}>{renderInline(b.text, key)}</h3>;
            return <h4 key={key}>{renderInline(b.text, key)}</h4>;
          case 'quote':
            return <blockquote key={key}>{renderInline(b.text, key)}</blockquote>;
          case 'ul':
            return (
              <ul key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'p':
          default:
            return (
              <p key={key}>
                {renderInline(b.text, key).map((n, j) => (
                  <Fragment key={`${key}-f${j}`}>{n}</Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
