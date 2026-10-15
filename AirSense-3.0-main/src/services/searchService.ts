import { supabase } from '@/lib/supabase';
import { INDIA_CITIES } from '@/data/indiaData';
import { generateDemoHotspots, generateDemoAqiObservations, generateDemoWeatherObservations } from '@/data/demoData';
import type { Hotspot, AqiObservation, WeatherObservation } from '@/types';

export interface SearchResult {
  type: 'city' | 'hotspot' | 'state';
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
  description: string;
}

class SearchService {
  async search(query: string): Promise<{ results: SearchResult[]; error: string | null }> {
    if (!query || query.trim().length < 2) {
      return { results: [], error: null };
    }

    const q = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    INDIA_CITIES.forEach((city) => {
      if (city.name.toLowerCase().includes(q) || city.state.toLowerCase().includes(q)) {
        results.push({
          type: 'city',
          name: city.name,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          description: `${city.name}, ${city.state}`,
        });
      }
    });

    try {
      const { data: hotspots } = await supabase
        .from('hotspots')
        .select('*')
        .or(`name.ilike.%${q}%,state.ilike.%${q}%,hotspot_code.ilike.%${q}%`)
        .limit(10);

      if (hotspots && hotspots.length > 0) {
        hotspots.forEach((h: Hotspot) => {
          results.push({
            type: 'hotspot',
            name: h.name,
            state: h.state ?? undefined,
            latitude: h.latitude,
            longitude: h.longitude,
            description: `Hotspot ${h.hotspot_code} - Risk: ${h.risk_level}`,
          });
        });
      } else {
        const demoHotspots = generateDemoHotspots().filter(
          (h) => h.name.toLowerCase().includes(q) || h.state?.toLowerCase().includes(q),
        );
        demoHotspots.forEach((h) => {
          results.push({
            type: 'hotspot',
            name: h.name,
            state: h.state ?? undefined,
            latitude: h.latitude,
            longitude: h.longitude,
            description: `Hotspot ${h.hotspot_code} - Risk: ${h.risk_level}`,
          });
        });
      }
    } catch {
      const demoHotspots = generateDemoHotspots().filter(
        (h) => h.name.toLowerCase().includes(q) || h.state?.toLowerCase().includes(q),
      );
      demoHotspots.forEach((h) => {
        results.push({
          type: 'hotspot',
          name: h.name,
          state: h.state ?? undefined,
          latitude: h.latitude,
          longitude: h.longitude,
          description: `Hotspot ${h.hotspot_code} - Risk: ${h.risk_level}`,
        });
      });
    }

    return { results: results.slice(0, 20), error: null };
  }

  async getLocationData(city: string): Promise<{
    hotspots: Hotspot[];
    aqi: AqiObservation | null;
    weather: WeatherObservation | null;
    isDemo: boolean;
  }> {
    const q = city.toLowerCase();
    const demoHotspots = generateDemoHotspots().filter((h) => h.state?.toLowerCase().includes(q) || h.name.toLowerCase().includes(q));
    const demoAqi = generateDemoAqiObservations().find((a) => a.city.toLowerCase() === q) ?? null;
    const demoWeather = generateDemoWeatherObservations().find((w) => w.city.toLowerCase() === q) ?? null;

    try {
      const [hotspotRes, aqiRes, weatherRes] = await Promise.all([
        supabase.from('hotspots').select('*').ilike('state', `%${city}%`).limit(10),
        supabase.from('aqi_observations').select('*').ilike('city', city).order('observed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('weather_observations').select('*').ilike('city', city).order('observed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const hasRealData = (hotspotRes.data && hotspotRes.data.length > 0) || aqiRes.data || weatherRes.data;

      if (!hasRealData) {
        return { hotspots: demoHotspots, aqi: demoAqi, weather: demoWeather, isDemo: true };
      }

      return {
        hotspots: (hotspotRes.data as Hotspot[]) ?? [],
        aqi: (aqiRes.data as AqiObservation) ?? null,
        weather: (weatherRes.data as WeatherObservation) ?? null,
        isDemo: false,
      };
    } catch {
      return { hotspots: demoHotspots, aqi: demoAqi, weather: demoWeather, isDemo: true };
    }
  }
}

export const searchService = new SearchService();
