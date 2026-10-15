import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** Consistent page header: title block left, contextual actions right. */
export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        {meta && <div className="mb-1.5">{meta}</div>}
        <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-[-0.025em] leading-tight">{title}</h1>
        {description && <p className="text-[13px] text-secondary mt-0.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

/** Small monospaced metadata line (timestamps, source labels). */
export function MetaLine({ children }: { children: ReactNode }) {
  return <span className="mono-label uppercase text-muted">{children}</span>;
}