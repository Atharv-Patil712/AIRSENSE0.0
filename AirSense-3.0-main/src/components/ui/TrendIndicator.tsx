import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  label?: string;
  /**
   * Environmental convention by default: rising values read as worsening (red).
   * Set `upIsGood` when an increase is the desirable direction.
   */
  upIsGood?: boolean;
  className?: string;
}

export function TrendIndicator({ direction, label, upIsGood = false, className = '' }: TrendIndicatorProps) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const good = direction === 'up' ? upIsGood : direction === 'down' ? !upIsGood : null;
  const colorClass = good === null ? 'text-muted' : good ? 'text-success-500' : 'text-danger-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium whitespace-nowrap ${colorClass} ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
      {label !== undefined && <span className="tnum">{label}</span>}
    </span>
  );
}
