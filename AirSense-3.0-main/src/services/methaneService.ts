import { supabase } from '@/lib/supabase';
import type { Hotspot, MethaneObservation } from '@/types';
import { generateDemoHotspots, generateMethaneTrend } from '@/data/demoData';
import { googleApiService } from '@/services/googleApiService';

export interface MethaneTrendPoint {
  date: string;
  value: number;
}

class MethaneService {
  async getHotspots(): Promise<{ data: Hotspot[]; isDemo: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hotspots')
        .select('*')
        .order('detection_timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: generateDemoHotspots(), isDemo: true, error: null };
      }

      return { data: data as Hotspot[], isDemo: false, error: null };
    } catch (err) {
      return {
        data: generateDemoHotspots(),
        isDemo: true,
        error: err instanceof Error ? err.message : 'Unable to retrieve methane observations.',
      };
    }
  }

  async enrichHotspotLocation(hotspot: Hotspot): Promise<{ data: Hotspot | null; error: string | null }> {
    if (hotspot.state && hotspot.district) {
      return { data: hotspot, error: null };
    }

    const result = await googleApiService.reverseGeocode(hotspot.latitude, hotspot.longitude);

    if (result.error || !result.data) {
      return { data: hotspot, error: result.error };
    }

    const components = result.data.address_components;
    const state = components.find((c) => c.types.includes('administrative_area_level_1'))?.long_name ?? hotspot.state;
    const district = components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ?? hotspot.district;

    return {
      data: { ...hotspot, state: state ?? hotspot.state, district: district ?? hotspot.district },
      error: null,
    };
  }

  async getHotspotById(id: string): Promise<{ data: Hotspot | null; isDemo: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase.from('hotspots').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return { data: (data as Hotspot) ?? null, isDemo: false, error: null };
    } catch (err) {
      const demo = generateDemoHotspots().find((h) => h.id === id);
      return {
        data: demo ?? null,
        isDemo: true,
        error: err instanceof Error ? err.message : 'Unable to retrieve hotspot.',
      };
    }
  }

  async getMethaneTrend(
    latitude: number,
    longitude: number,
    days = 30,
    baseValue = 2000,
    seed = 42,
    options: { limit?: number } = {},
  ): Promise<{ data: MethaneTrendPoint[]; isDemo: boolean }> {
    try {
      const { data, error } = await supabase
        .from('methane_observations')
        .select('*')
        .gte('observed_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('observed_at', { ascending: true })
        .limit(options.limit ?? days);

      if (error) throw error;

      if (data && data.length >= days) {
        return {
          data: (data as MethaneObservation[]).map((o) => ({
            date: o.observed_at.split('T')[0],
            value: o.methane_index,
          })),
          isDemo: false,
        };
      }
      return {
        data: generateMethaneTrend(days, baseValue, seed + Math.round(latitude * 10) + Math.round(longitude * 10)),
        isDemo: true,
      };
    } catch {
      return {
        data: generateMethaneTrend(days, baseValue, seed + Math.round(latitude * 10) + Math.round(longitude * 10)),
        isDemo: true,
      };
    }
  }

  async getRecentChanges(): Promise<{ count: number; trend: 'up' | 'down' | 'stable'; isDemo: boolean }> {
    try {
      const { count, error } = await supabase
        .from('hotspots')
        .select('*', { count: 'exact', head: true })
        .gte('detection_timestamp', new Date(Date.now() - 86400000).toISOString());

      if (error) throw error;
      return { count: count ?? 0, trend: count && count > 5 ? 'up' : 'stable', isDemo: false };
    } catch {
      return { count: 3, trend: 'up', isDemo: true };
    }
  }

  async createHotspot(hotspot: Omit<Hotspot, 'id' | 'created_at' | 'updated_at'>): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('hotspots').insert(hotspot);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create hotspot.' };
    }
  }
}

export const methaneService = new MethaneService();
