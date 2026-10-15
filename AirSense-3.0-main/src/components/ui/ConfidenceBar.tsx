interface ConfidenceBarProps {
  value: number;
  label?: string;
  /** Indigo distinguishes model confidence from environmental safety. */
  tone?: 'green' | 'yellow' | 'blue' | 'violet';
  showValue?: boolean;
}

const TONE_COLOR: Record<string, string> = {
  green: 'var(--color-good)',
  yellow: 'var(--color-moderate)',
  blue: 'var(--color-primary-bg)',
  violet: 'var(--color-prediction)',
};

/** Horizontal confidence meter — quiet, precise, labeled. */
export function ConfidenceBar({ value, label, tone = 'violet', showValue = true }: ConfidenceBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between mb-1">
          {label && <span className="kicker">{label}</span>}
          {showValue && <span className="mono-label tnum">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-[5px] rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: TONE_COLOR[tone] }}
        />
      </div>
    </div>
  );
}
