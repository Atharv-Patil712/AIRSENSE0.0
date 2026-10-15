import { useCallback, useEffect, useState } from 'react';
import { savedLocationsService } from '@/services/savedLocationsService';
import type { SavedLocation } from '@/types';

export interface SavedLocationInput {
  name: string;
  state: string | null;
  latitude: number;
  longitude: number;
}

/** Saved locations with cross-component sync (custom + storage events). */
export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);

  useEffect(() => {
    let mounted = true;
    savedLocationsService.getAll().then((l) => {
      if (mounted) setLocations(l);
    });
    const unsubscribe = savedLocationsService.subscribe(() => {
      savedLocationsService.getAll().then((l) => {
        if (mounted) setLocations(l);
      });
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isSaved = useCallback(
    (name: string) => locations.some((l) => l.name.toLowerCase() === name.toLowerCase()),
    [locations],
  );

  const toggle = useCallback(
    async (input: SavedLocationInput) => {
      if (isSaved(input.name)) {
        const existing = locations.find((l) => l.name.toLowerCase() === input.name.toLowerCase());
        if (existing) await savedLocationsService.remove(existing.id);
      } else {
        await savedLocationsService.add(input);
      }
    },
    [isSaved, locations],
  );

  return { locations, isSaved, toggle };
}
