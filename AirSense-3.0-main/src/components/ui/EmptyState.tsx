import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Thoughtful empty state — quiet, informative, actionable. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-14 text-center">
      {Icon && <Icon className="w-5 h-5 mx-auto mb-3 text-muted" strokeWidth={1.75} />}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-[13px] text-muted mt-1 max-w-xs mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
