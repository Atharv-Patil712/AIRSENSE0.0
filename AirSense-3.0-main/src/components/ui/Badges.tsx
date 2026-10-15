import { RISK_COLORS } from '@/data/indiaData';

const SEVERITY_CLASS: Record<string, string> = {
  low: 'badge badge-blue',
  medium: 'badge badge-yellow',
  high: 'badge badge-orange',
  critical: 'badge badge-red',
};

/** Alert severity badge — informational blue through to red. */
export function SeverityBadge({ severity }: { severity: string }) {
  return <span className={SEVERITY_CLASS[severity] ?? 'badge badge-neutral'}>{severity}</span>;
}

/** Risk level badge with the shared severity-colored dot. */
export function RiskBadge({ level }: { level: string }) {
  return (
    <span className="badge badge-neutral capitalize">
      <span
        className="status-dot"
        style={{ backgroundColor: RISK_COLORS[level] ?? 'var(--color-border-strong)' }}
      />
      {level}
    </span>
  );
}
