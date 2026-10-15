import { Loader2 } from 'lucide-react';
import type { CSSProperties } from 'react';

export function LoadingSpinner({ size = 20, label }: { size?: number; label?: string }) {
  const style: CSSProperties = { width: size, height: size };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <Loader2 className="animate-spin text-primary-500" style={style} strokeWidth={2} />
      {label && <p className="text-[13px] text-muted">{label}</p>}
    </div>
  );
}

export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <LoadingSpinner size={24} label={label} />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

/** Clean loading skeleton — use for known layout shapes. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Skeleton block for a standard metrics row + panels layout. */
export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
