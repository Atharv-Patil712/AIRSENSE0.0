import { supabase } from '@/lib/supabase';
import type { EnvironmentalAlert } from '@/types';
import { generateDemoAlerts, generateDemoHotspots } from '@/data/demoData';

class AlertService {
  async getAlerts(): Promise<{ data: EnvironmentalAlert[]; isDemo: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('environmental_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: generateDemoAlerts(generateDemoHotspots()), isDemo: true, error: null };
      }

      return { data: data as EnvironmentalAlert[], isDemo: false, error: null };
    } catch (err) {
      return {
        data: generateDemoAlerts(generateDemoHotspots()),
        isDemo: true,
        error: err instanceof Error ? err.message : 'Unable to retrieve alerts.',
      };
    }
  }

  async markAsRead(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('environmental_alerts').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update alert.' };
    }
  }

  async createAlert(alert: Omit<EnvironmentalAlert, 'id' | 'created_at'>): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('environmental_alerts').insert(alert);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create alert.' };
    }
  }
}

export const alertService = new AlertService();
