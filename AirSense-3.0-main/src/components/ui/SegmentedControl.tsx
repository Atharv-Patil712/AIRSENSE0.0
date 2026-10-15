export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  dotColor?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Single-select pill group — the standard filter/sorter control. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex items-center gap-1 p-1 surface shadow-panel w-fit ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-md capitalize transition-colors ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'
            } ${
              isActive
                ? 'bg-[var(--color-surface-2)] font-medium text-[var(--color-text)]'
                : 'text-muted hover:text-[var(--color-text)]'
            }`}
          >
            {opt.dotColor && (
              <span className="status-dot !w-[6px] !h-[6px]" style={{ backgroundColor: opt.dotColor }} />
            )}
            {opt.label}
            {opt.count !== undefined && <span className="mono-label text-muted tnum">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
