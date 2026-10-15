import type { ReactNode } from 'react';

/**
 * CSS-only hover tooltip — inverts surface/text so it works in both themes.
 * Keep labels short; this is a hint, not documentation.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group/tooltip">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md text-[11px] leading-tight font-medium whitespace-nowrap z-30 opacity-0 translate-y-0.5 transition-all duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 shadow-popover"
        style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
      >
        {label}
      </span>
    </span>
  );
}
