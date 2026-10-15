import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}

/**
 * Modern content container:
 * Crisp rounded border, subtle drop shadow, frosted glass surface, and clean typography.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = '',
  flush = false,
}: PanelProps) {
  const hasHeader = Boolean(title || actions);
  return (
    <section className={`surface shadow-panel rounded-2xl border border-[var(--color-border)]/80 hover:shadow-md transition-all duration-300 ${className}`}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--color-border)]/60">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-[15px] sm:text-[16px] font-semibold tracking-tight leading-5 text-[var(--color-text)]">
                {title}
              </h2>
            )}
            {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`${flush ? '' : hasHeader ? 'px-5 pb-5 pt-4' : 'p-5'} ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}