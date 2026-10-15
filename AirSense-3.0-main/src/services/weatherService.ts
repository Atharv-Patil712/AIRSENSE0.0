import { supabase } from '@/lib/supabase';
import type { WeatherObservation } from '@/types';
import { generateDemoWeatherObservations, generateWeatherTrend } from '@/data/demoData';

export interface WeatherTrendPoint {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

class WeatherService {
  async getWeatherObservations(): Promise<{ data: WeatherObservation[]; isDemo: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('weather_observations')
        .select('*')
        .order('observed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: generateDemoWeatherObservations(), isDemo: true, error: null };
      }

      return { data: data as WeatherObservation[], isDemo: false, error: null };
    } catch (err) {
      return {
        data: generateDemoWeatherObservations(),
        isDemo: true,
        error: err instanceof Error ? err.message : 'Weather data temporarily unavailable.',
      };
    }
  }

  async getWeatherByCity(city: string): Promise<{ data: WeatherObservation | null; isDemo: boolean; error: string | null }> {
    const q = city.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('weather_observations')
        .select('*')
        .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) return { data: data as WeatherObservation, isDemo: false, error: null };

      const demo = generateDemoWeatherObservations().find(
        (w) => w.city.toLowerCase() === q || w.state?.toLowerCase() === q || w.city.toLowerCase().includes(q) || (w.state && w.state.toLowerCase().includes(q)),
      );
      return { data: demo ?? null, isDemo: true, error: null };
    } catch (err) {
      const demo = generateDemoWeatherObservations().find(
        (w) => w.city.toLowerCase() === q || w.state?.toLowerCase() === q || w.city.toLowerCase().includes(q) || (w.state && w.state.toLowerCase().includes(q)),
      );
      return {
        data: demo ?? null,
        isDemo: true,
        error: err instanceof Error ? err.message : 'Weather data temporarily unavailable.',
      };
    }
  }

  async getWeatherTrend(
    city: string,
    hours = 24,
    baseTemp = 28,
  ): Promise<{ data: WeatherTrendPoint[]; isDemo: boolean }> {
    try {
      const { data, error } = await supabase
        .from('weather_observations')
        .select('*')
        .ilike('city', city)
        .gte('observed_at', new Date(Date.now() - hours * 3600000).toISOString())
        .order('observed_at', { ascending: true })
        .limit(hours);

      if (error) throw error;

      if (data && data.length >= hours / 2) {
        return {
          data: (data as WeatherObservation[]).map((o) => ({
            time: o.observed_at,
            temperature: o.temperature ?? 0,
            humidity: o.humidity ?? 0,
            windSpeed: o.wind_speed ?? 0,
          })),
          isDemo: false,
        };
      }

      const seed = city.charCodeAt(0) + city.length;
      return { data: generateWeatherTrend(hours, baseTemp, seed), isDemo: true };
    } catch {
      const seed = city.charCodeAt(0) + city.length;
      return { data: generateWeatherTrend(hours, baseTemp, seed), isDemo: true };
    }
  }
}

export const weatherService = new WeatherService();
