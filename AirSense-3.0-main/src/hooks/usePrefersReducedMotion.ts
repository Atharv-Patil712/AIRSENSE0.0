import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function readPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * Tracks the OS-level motion preference and keeps up with changes while mounted.
 * Used by the cinematic experience to swap scroll-linked camera work for a
 * static composition, rather than only shortening the animations.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPreference);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
