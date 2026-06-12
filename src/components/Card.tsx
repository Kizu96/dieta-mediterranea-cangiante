import type { ReactNode } from 'react';

export function Card({
  title,
  icon,
  action,
  children,
  flush,
}: {
  title?: ReactNode;
  icon?: ReactNode; // icona lucide (o emoji legacy) accanto al titolo
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className={flush ? 'card flush' : 'card'}>
      {(title || action) && (
        <div className="card-title flex-between" style={flush ? { padding: '14px 14px 0' } : undefined}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && (
              <span className="card-icon" aria-hidden="true">
                {icon}
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
