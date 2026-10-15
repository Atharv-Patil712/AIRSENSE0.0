import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/format';

interface FreshnessStampProps {
  timestamp: string | number | Date;
  label?: string;
  pulse?: boolean;
}

/** Live "Updated · 4m ago" stamp — re-renders every 30 s. */
export function FreshnessStamp({ timestamp, label = 'Updated', pulse = true }: FreshnessStampProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 mono-label uppercase text-muted">
      {pulse && (
        <span className="relative flex w-1.5 h-1.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-50" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary-500" />
        </span>
      )}
      <span className="font-body normal-case tracking-normal">
        {label} · <span className="font-mono">{timeAgo(timestamp)}</span>
      </span>
    </span>
  );
}
