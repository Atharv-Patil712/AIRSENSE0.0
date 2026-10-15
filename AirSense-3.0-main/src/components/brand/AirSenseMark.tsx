interface AirSenseMarkProps {
  className?: string;
}

/**
 * AirSense brand mark — a sensing-wave glyph.
 * A fixed observation point emitting concentric signal arcs.
 */
export function AirSenseMark({ className = 'w-6 h-6' }: AirSenseMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="17" r="2.1" fill="currentColor" />
      <path d="M7 12A5 5 0 0 1 12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
      <path d="M7 8A9 9 0 0 1 16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.68" />
      <path d="M7 4A13 13 0 0 1 20 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface AirSenseLogoProps {
  size?: 'sm' | 'md';
  region?: boolean;
  onClick?: () => void;
}

/** Full lockup: mark + wordmark (+ optional region tag). */
export function AirSenseLogo({ size = 'md', region = true, onClick }: AirSenseLogoProps) {
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-2.5 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <span
        className={`grid place-items-center rounded-lg bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-500 text-white shadow-[0_2px_10px_rgba(14,165,233,0.35)] transition-transform duration-200 group-hover:scale-105 ${
          isSm ? 'w-7 h-7' : 'w-8 h-8'
        }`}
      >
        <AirSenseMark className={isSm ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
      </span>
      <span className="flex items-baseline gap-2">
        <span className={`font-display font-bold tracking-tight bg-gradient-to-r from-[var(--color-text)] to-[var(--color-text-secondary)] bg-clip-text ${isSm ? 'text-sm' : 'text-[15px]'}`}>
          AirSense
        </span>
        {region && (
          <span className="mono-label uppercase text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold hidden sm:inline">India</span>
        )}
      </span>
    </span>
  );
}