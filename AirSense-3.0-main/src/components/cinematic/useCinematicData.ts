import { useEffect, useState } from 'react';
import { aqiService } from '@/services/aqiService';
import { methaneService } from '@/services/methaneService';
import { weatherService } from '@/services/weatherService';
import type { AqiObservation, Hotspot, WeatherObservation } from '@/types';
import { buildCinematicData, createFallbackCinematicData } from './model';
import type { CinematicData } from './types';

/**
 * Resolves the cinematic contract from the existing AirSense services.
 *
 * The AQI service is currently mid-refactor upstream — depending on the branch
 * it returns either a bare array or the older `{ data, isDemo, error }`
 * envelope — so every response is normalised here rather than assumed. This
 * keeps the experience decoupled from that decision.
 *
 * The page paints immediately from the fallback contract and upgrades in place
 * when live observations land, so there is never a loading wall.
 */
function unwrapList<T>(result: unknown): { data: T[]; isDemo: boolean } {
  if (Array.isArray(result)) return { data: result as T[], isDemo: false };
  if (result && typeof result === 'object' && 'data' in result) {
    const envelope = result as { data?: T[] | null; isDemo?: boolean };
    return { data: envelope.data ?? [], isDemo: Boolean(envelope.isDemo) };
  }
  return { data: [], isDemo: true };
}

export interface CinematicDataState {
  data: CinematicData;
  /** True while the live observation pass is still in flight. */
  loading: boolean;
}

export function useCinematicData(): CinematicDataState {
  const [data, setData] = useState<CinematicData>(createFallbackCinematicData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [hotspotResult, aqiResult, weatherResult] = await Promise.all([
          methaneService.getHotspots(),
          aqiService.getAqiObservations(),
          weatherService.getWeatherObservations(),
        ]);

        const hotspots = unwrapList<Hotspot>(hotspotResult);
        const aqi = unwrapList<AqiObservation>(aqiResult);
        const weather = unwrapList<WeatherObservation>(weatherResult);

        if (cancelled) return;

        // Nothing upstream returned anything usable — keep the labelled fallback.
        if (hotspots.data.length === 0 && aqi.data.length === 0 && weather.data.length === 0) {
          return;
        }

        // The envelope shape (either contract) is normalised above, so the
        // trend is fetched for the leading observation's city.
        const trend = unwrapList<{ aqi: number }>(
          await aqiService.getAqiTrend(aqi.data[0]?.city ?? 'Delhi', 30),
        );
        if (cancelled) return;

        setData(
          buildCinematicData({
            hotspots: hotspots.data,
            aqi: aqi.data,
            weather: weather.data,
            aqiTrend: trend.data,
            isDemo: hotspots.isDemo || aqi.isDemo || weather.isDemo,
          }),
        );
      } catch (error) {
        console.warn('AirSense: live observations unavailable — showing the reference set.', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}