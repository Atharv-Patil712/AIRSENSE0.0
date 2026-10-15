import { supabase } from '@/lib/supabase';
import type { SavedLocation } from '@/types';

const LS_KEY = 'airsense-saved-locations';
const CHANGE_EVENT = 'airsense-saved-locations-changed';

function readLocal(): SavedLocation[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as SavedLocation[];
  } catch {
    return [];
  }
}

function notify(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Saved locations — Supabase-backed when a session exists,
 * with a transparent localStorage fallback so the feature works offline/demo.
 * The active mode is reported via `isLocal`.
 */
class SavedLocationsService {
  private cache: SavedLocation[] | null = null;
  private usingLocal = false;

  /** Subscribe to change notifications. Returns an unsubscribe function. */
  subscribe(cb: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, cb);
    window.addEventListener('storage', cb);
    return () => {
      window.removeEventListener(CHANGE_EVENT, cb);
      window.removeEventListener('storage', cb);
    };
  }

  async getAll(): Promise<SavedLocation[]> {
    if (this.cache) return this.cache;
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        this.cache = data as SavedLocation[];
        this.usingLocal = false;
        return this.cache;
      }
    } catch {
      /* fall through to local storage */
    }
    this.cache = readLocal();
    this.usingLocal = true;
    return this.cache;
  }

  async add(input: { name: string; state: string | null; latitude: number; longitude: number }): Promise<void> {
    if (!this.usingLocal) {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (uid) {
          const { data, error } = await supabase
            .from('saved_locations')
            .insert({ user_id: uid, ...input })
            .select()
            .single();
          if (!error && data) {
            this.cache = [data as SavedLocation, ...(this.cache ?? [])];
            notify();
            return;
          }
        }
      } catch {
        /* fall through to local storage */
      }
    }
    const loc: SavedLocation = {
      id: `local-${Date.now()}`,
      user_id: 'local',
      name: input.name,
      state: input.state,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: null,
      created_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([loc, ...readLocal()]));
    } catch {
      /* ignore */
    }
    this.cache = [loc, ...(this.cache ?? [])];
    this.usingLocal = true;
    notify();
  }

  async remove(id: string): Promise<void> {
    if (!id.startsWith('local-')) {
      try {
        await supabase.from('saved_locations').delete().eq('id', id);
      } catch {
        /* best-effort */
      }
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(readLocal().filter((l) => l.id !== id)));
    } catch {
      /* ignore */
    }
    this.cache = (this.cache ?? []).filter((l) => l.id !== id);
    notify();
  }
}

export const savedLocationsService = new SavedLocationsService();
