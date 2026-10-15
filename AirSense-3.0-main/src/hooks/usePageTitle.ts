import { useEffect } from 'react';

const BASE_TITLE = 'AirSense — Environmental Intelligence Platform';

/** Sets the document title per page and restores the base title on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · AirSense`;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
