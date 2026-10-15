interface LegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}

/** Shared chart legend row — one visual grammar under every composed chart. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 mono-label uppercase text-muted">
          {item.dashed ? (
            <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <span className="w-3.5 h-[2px] rounded" style={{ backgroundColor: item.color }} />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}
