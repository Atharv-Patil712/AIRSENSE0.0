import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, CornerDownLeft, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { searchService } from '@/services/searchService';
import { INDIA_CITIES } from '@/data/indiaData';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { kbdLabel } from '@/lib/platform';
import { navGroups } from '@/config/navigation';

interface PaletteItem {
  id: string;
  group: 'Pages' | 'Saved locations' | 'Cities' | 'Hotspots';
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Global command palette — pages, saved locations, cities and hotspots
 * in one keyboard-first surface (↑↓ navigate · ↵ open · esc close).
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { locations: savedLocations } = useSavedLocations();
  const [query, setQuery] = useState('');
  const [hotspotResults, setHotspotResults] = useState<
    { name: string; state?: string; latitude: number; longitude: number; description: string }[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setHotspotResults([]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced hotspot lookup (pages/cities filter locally)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setHotspotResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { results } = await searchService.search(q);
      setHotspotResults(results.filter((r) => r.type === 'hotspot').slice(0, 5));
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const goToMap = useCallback(
    (lat: number, lng: number, name: string) => {
      onClose();
      navigate(`/map?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}`);
    },
    [navigate, onClose],
  );

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (...fields: string[]) => q === '' || fields.some((f) => f.toLowerCase().includes(q));

    const pages: PaletteItem[] = navGroups
      .flatMap((g) => g.items)
      .filter((item) => match(item.label, item.description))
      .map((item) => ({
        id: `page-${item.to}`,
        group: 'Pages' as const,
        label: item.label,
        description: item.description,
        icon: item.icon,
        action: () => {
          onClose();
          navigate(item.to);
        },
      }));

    const saved: PaletteItem[] = savedLocations
      .filter((l) => match(l.name, l.state ?? ''))
      .slice(0, 5)
      .map((l) => ({
        id: `saved-${l.id}`,
        group: 'Saved locations' as const,
        label: l.name,
        description: l.state ?? undefined,
        icon: Star,
        action: () => goToMap(l.latitude, l.longitude, l.name),
      }));

    const cities: PaletteItem[] = INDIA_CITIES.filter((c) => match(c.name, c.state))
      .slice(0, 6)
      .map((c) => ({
        id: `city-${c.name}`,
        group: 'Cities' as const,
        label: c.name,
        description: `${c.name}, ${c.state}`,
        icon: MapPin,
        action: () => goToMap(c.latitude, c.longitude, c.name),
      }));

    const hotspots: PaletteItem[] = hotspotResults
      .filter((h) => match(h.name, h.description))
      .map((h, i) => ({
        id: `hotspot-${h.name}-${i}`,
        group: 'Hotspots' as const,
        label: h.name,
        description: h.description,
        icon: Compass,
        action: () => goToMap(h.latitude, h.longitude, h.name),
      }));

    return [...pages, ...saved, ...cities, ...hotspots];
  }, [query, savedLocations, hotspotResults, navigate, onClose, goToMap]);

  // Group-ordered rendering with headers; keyboard index spans the flat list
  const grouped = useMemo(() => {
    const order: PaletteItem['group'][] = ['Pages', 'Saved locations', 'Cities', 'Hotspots'];
    return order
      .map((group) => ({ group, items: items.filter((i) => i.group === group) }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  useEffect(() => {
    setActiveIndex((prev) => (prev >= items.length ? Math.max(0, items.length - 1) : prev));
  }, [items.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[activeIndex]?.action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh] animate-overlay-in"
      style={{ background: 'var(--overlay)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="w-full max-w-xl surface shadow-popover overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, cities, saved locations, hotspots…"
            className="w-full bg-transparent py-3.5 text-[14px] outline-none placeholder:text-[var(--color-text-muted)]"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="mono-label uppercase text-muted border border-[var(--color-border)] rounded px-1.5 py-0.5 hidden sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[46vh] overflow-y-auto scrollbar-thin py-2">
          {grouped.map(({ group, items: groupItems }) => (
            <div key={group} className="mb-1">
              <p className="kicker px-4 py-1.5">{group}</p>
              <ul>
                {groupItems.map((item) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  const isActive = idx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        data-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          isActive ? 'bg-[var(--color-primary-soft)]' : ''
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-[var(--color-primary-text)]' : 'text-muted'
                          }`}
                          strokeWidth={1.75}
                        />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13.5px] truncate ${isActive ? 'font-medium' : ''}`}>
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="block text-[11.5px] text-muted truncate">{item.description}</span>
                          )}
                        </span>
                        {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-muted flex-shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">No results for “{query}”</p>
              <p className="text-[13px] text-muted mt-1">Try a city, state, hotspot code or page name.</p>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-4 px-4 py-2 border-t border-[var(--color-border)]">
          <span className="flex items-center gap-1.5 mono-label uppercase text-muted">
            <kbd className="border border-[var(--color-border)] rounded px-1">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1.5 mono-label uppercase text-muted">
            <kbd className="border border-[var(--color-border)] rounded px-1">↵</kbd> open
          </span>
          <span className="ml-auto mono-label uppercase text-muted hidden sm:block">{kbdLabel}</span>
        </footer>
      </div>
    </div>
  );
}
