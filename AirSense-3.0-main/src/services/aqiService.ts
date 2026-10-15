import { supabase } from '@/lib/supabase';
import type { AqiObservation } from '@/types';
import { generateDemoAqiObservations, generateAqiTrend } from '@/data/demoData';

export interface AqiTrendPoint {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

class AqiService {
  async getAqiObservations(): Promise<{ data: AqiObservation[]; isDemo: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('aqi_observations')
        .select('*')
        .order('observed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: generateDemoAqiObservations(), isDemo: true, error: null };
      }

      return { data: data as AqiObservation[], isDemo: false, error: null };
    } catch (err) {
      return {
        data: generateDemoAqiObservations(),
        isDemo: true,
        error: err instanceof Error ? err.message : 'Unable to retrieve AQI data.',
      };
    }
  }

  async getAqiByCity(city: string): Promise<{ data: AqiObservation | null; isDemo: boolean; error: string | null }> {
    const q = city.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('aqi_observations')
        .select('*')
        .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) return { data: data as AqiObservation, isDemo: false, error: null };

      const demo = generateDemoAqiObservations().find(
        (a) => a.city.toLowerCase() === q || a.state?.toLowerCase() === q || a.city.toLowerCase().includes(q) || (a.state && a.state.toLowerCase().includes(q)),
      );
      return { data: demo ?? null, isDemo: true, error: null };
    } catch (err) {
      const demo = generateDemoAqiObservations().find(
        (a) => a.city.toLowerCase() === q || a.state?.toLowerCase() === q || a.city.toLowerCase().includes(q) || (a.state && a.state.toLowerCase().includes(q)),
      );
      return {
        data: demo ?? null,
        isDemo: true,
        error: err instanceof Error ? err.message : 'Unable to retrieve AQI data.',
      };
    }
  }

  async getAqiTrend(
    city: string,
    days = 30,
  ): Promise<{ data: AqiTrendPoint[]; isDemo: boolean }> {
    try {
      const { data, error } = await supabase
        .from('aqi_observations')
        .select('*')
        .ilike('city', city)
        .gte('observed_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('observed_at', { ascending: true })
        .limit(days);

      if (error) throw error;

      if (data && data.length >= days / 2) {
        return {
          data: (data as AqiObservation[]).map((o) => ({
            date: o.observed_at.split('T')[0],
            aqi: o.aqi,
            pm25: o.pm25 ?? 0,
            pm10: o.pm10 ?? 0,
          })),
          isDemo: false,
        };
      }

      const seed = city.charCodeAt(0) + city.length;
      return { data: generateAqiTrend(days, 150, seed), isDemo: true };
    } catch {
      const seed = city.charCodeAt(0) + city.length;
      return { data: generateAqiTrend(days, 150, seed), isDemo: true };
    }
  }
}

export const aqiService = new AqiService();
