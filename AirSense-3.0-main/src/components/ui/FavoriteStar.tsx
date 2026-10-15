import { Star } from 'lucide-react';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { Tooltip } from './Tooltip';

interface FavoriteStarProps {
  name: string;
  state?: string | null;
  latitude: number;
  longitude: number;
  className?: string;
}

/**
 * Save/unsave a location. Persists to Supabase when a session exists,
 * otherwise to local storage. Safe inside clickable rows (stops propagation).
 */
export function FavoriteStar({ name, state, latitude, longitude, className = '' }: FavoriteStarProps) {
  const { isSaved, toggle } = useSavedLocations();
  const saved = isSaved(name);

  return (
    <Tooltip label={saved ? 'Remove from saved' : 'Save location'}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void toggle({ name, state: state ?? null, latitude, longitude });
        }}
        aria-label={saved ? `Remove ${name} from saved locations` : `Save ${name}`}
        aria-pressed={saved}
        className={`p-1 rounded-md transition-colors hover:bg-[var(--color-surface-2)] ${className}`}
      >
        <Star
          className={`w-3.5 h-3.5 transition-colors duration-150 ${
            saved ? 'fill-warning-400 text-warning-400' : 'text-muted'
          }`}
          strokeWidth={1.75}
        />
      </button>
    </Tooltip>
  );
}
