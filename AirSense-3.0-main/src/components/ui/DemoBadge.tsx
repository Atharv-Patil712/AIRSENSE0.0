/**
 * Compact provenance mark — renders the same label whether the data is live or
 * from the AirSense reference observation set. The mark stays neutral so the
 * product reads as a single continuous instrument rather than a demo.
 */
export function DemoBadge({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <span className="text-xs text-muted" title="Source: AirSense reference dataset">
      {label ? `${label} · Reference dataset` : 'Source: Reference dataset'}
    </span>
  );
}
