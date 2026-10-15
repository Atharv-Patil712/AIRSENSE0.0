import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type MetricTone = 'neutral' | 'green' | 'yellow' | 'orange' | 'red' | 'blue';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  tone?: MetricTone;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

const toneStyles: Record<
  MetricTone,
  {
    valueColor: string;
    dotBg: string;
    iconBg: string;
    iconColor: string;
    borderTop: string;
    glow: string;
  }
> = {
  neutral: {
    valueColor: 'text-[var(--color-text)]',
    dotBg: 'bg-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800/80',
    iconColor: 'text-slate-600 dark:text-slate-300',
    borderTop: 'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600',
    glow: '',
  },
  green: {
    valueColor: 'text-emerald-600 dark:text-emerald-400',
    dotBg: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderTop: 'from-emerald-400 to-teal-500',
    glow: 'group-hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.18)]',
  },
  yellow: {
    valueColor: 'text-amber-600 dark:text-amber-400',
    dotBg: 'bg-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderTop: 'from-amber-400 to-yellow-500',
    glow: 'group-hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.18)]',
  },
  orange: {
    valueColor: 'text-orange-600 dark:text-orange-400',
    dotBg: 'bg-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-800/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderTop: 'from-orange-400 to-amber-500',
    glow: 'group-hover:shadow-[0_12px_28px_-6px_rgba(249,115,22,0.18)]',
  },
  red: {
    valueColor: 'text-rose-600 dark:text-rose-400',
    dotBg: 'bg-rose-500',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderTop: 'from-rose-500 to-red-600',
    glow: 'group-hover:shadow-[0_12px_28px_-6px_rgba(244,63,94,0.18)]',
  },
  blue: {
    valueColor: 'text-sky-600 dark:text-sky-400',
    dotBg: 'bg-sky-500',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    borderTop: 'from-sky-400 to-cyan-500',
    glow: 'group-hover:shadow-[0_12px_28px_-6px_rgba(14,165,233,0.18)]',
  },
};

/**
 * Modern, fresh StatCard:
 * Visual icon badge, glowing top accent bar, hover elevation, and clean metadata.
 */
export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  tone = 'neutral',
  subtitle,
  icon,
  className = '',
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // For environmental data: rising values mean worsening conditions
  const trendPillClass =
    trend === 'up'
      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
      : trend === 'down'
        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
        : 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/40';

  const style = toneStyles[tone];

  return (
    <div
      className={`group relative flex flex-col p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-500/30 transition-all duration-300 ease-out overflow-hidden ${style.glow} ${className}`}
    >
      {/* Top subtle accent gradient bar */}
      <div
        className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${style.borderTop} opacity-85 group-hover:h-1 transition-all duration-300`}
      />

      {/* Header: Icon + Label, Trend pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon ? (
            <div className={`p-2 rounded-xl ${style.iconBg} ${style.iconColor} transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-sm`}>
              {icon}
            </div>
          ) : (
            <span className={`w-2 h-2 rounded-full ${style.dotBg} animate-pulse flex-shrink-0`} />
          )}
          <span className="kicker !text-[11px] font-semibold tracking-wider text-muted group-hover:text-[var(--color-text)] transition-colors truncate">
            {label}
          </span>
        </div>

        {trend && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${trendPillClass}`}>
            <TrendIcon className="w-3 h-3" />
            {trendLabel}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className={`metric-value text-[28px] sm:text-[32px] font-bold tracking-tight leading-none ${style.valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted font-medium ml-0.5">{unit}</span>}
      </div>

      {/* Context Subtitle */}
      {subtitle && (
        <p className="text-[12px] text-muted mt-2 truncate flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
