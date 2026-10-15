import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { UserPreferences, ThemeMode, AlertSeverity } from '@/types';
import { INDIA_CITIES } from '@/data/indiaData';
import { PageHeader } from '@/components/ui/PageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SettingsPage() {
  usePageTitle('Settings');
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [organization, setOrganization] = useState(profile?.organization ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.full_name !== undefined) setFullName(profile.full_name ?? '');
      if (profile.organization !== undefined) setOrganization(profile.organization ?? '');
    }
  }, [profile]);

  useEffect(() => {
    async function loadPrefs() {
      if (!user) return;
      try {
        const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
        if (data) setPrefs(data as UserPreferences);
        else {
          // Create default prefs
          const { data: newPrefs } = await supabase.from('user_preferences').insert({ user_id: user.id }).select().maybeSingle();
          if (newPrefs) setPrefs(newPrefs as UserPreferences);
        }
      } catch {
        /* guest or offline fallback */
      }
    }
    loadPrefs();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName, organization }).eq('id', user.id);
      await refreshProfile();
    } catch {
      /* guest mode fallback */
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSavePrefs = async (updates: Partial<UserPreferences>) => {
    if (!user) return;
    const current: UserPreferences = prefs ?? {
      user_id: user.id,
      theme: 'system',
      default_map_layers: ['methane', 'aqi'],
      notification_enabled: true,
      email_alerts: true,
      alert_severity_filter: 'low',
      temperature_unit: 'celsius',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated: UserPreferences = { ...current, ...updates };
    setPrefs(updated);
    try {
      await supabase.from('user_preferences').update(updates).eq('user_id', user.id);
    } catch {
      /* guest or offline fallback */
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Settings"
        description="Profile, preferences and application configuration"
      />

      {/* Profile */}
      <div className="surface p-5">
        <p className="kicker mb-4">Profile</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input type="email" value={user?.email ?? ''} disabled className="input-field opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Organization</label>
            <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your organization" className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Role</label>
            <span className="badge bg-primary-500/10 text-primary-500 capitalize">{profile?.role ?? 'user'}</span>
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}</>}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="surface p-5">
        <p className="kicker mb-4">Appearance</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value as ThemeMode); handleSavePrefs({ theme: opt.value as ThemeMode }); }}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${theme === opt.value ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Temperature Unit</label>
            <div className="grid grid-cols-2 gap-2">
              {(['celsius', 'fahrenheit'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => handleSavePrefs({ temperature_unit: unit })}
                  className={`p-2 rounded-lg border text-sm capitalize transition-colors ${prefs?.temperature_unit === unit ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}
                >
                  {unit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="surface p-5">
        <p className="kicker mb-4">Notifications</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 surface-2 rounded-lg cursor-pointer">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted">Receive in-app alerts for environmental events</p>
            </div>
            <input
              type="checkbox"
              checked={prefs?.notification_enabled ?? true}
              onChange={(e) => handleSavePrefs({ notification_enabled: e.target.checked })}
              className="rounded border-[var(--color-border)] text-primary-500"
            />
          </label>
          <label className="flex items-center justify-between p-3 surface-2 rounded-lg cursor-pointer">
            <div>
              <p className="text-sm font-medium">Email Alerts</p>
              <p className="text-xs text-muted">Receive email notifications for critical alerts</p>
            </div>
            <input
              type="checkbox"
              checked={prefs?.email_alerts ?? true}
              onChange={(e) => handleSavePrefs({ email_alerts: e.target.checked })}
              className="rounded border-[var(--color-border)] text-primary-500"
            />
          </label>
          <div className="p-3 surface-2 rounded-lg">
            <label className="text-sm font-medium mb-2 block">Alert Severity Filter</label>
            <p className="text-xs text-muted mb-2">Show alerts at or above this severity level</p>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => handleSavePrefs({ alert_severity_filter: sev as AlertSeverity })}
                  className={`p-2 rounded-lg text-xs font-medium capitalize transition-colors ${prefs?.alert_severity_filter === sev ? 'bg-primary-500/10 text-primary-500 border border-primary-500' : 'border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="surface p-5">
        <p className="kicker mb-4">Data sources</p>
        <div className="space-y-2">
          {[
            { name: 'Supabase Database', status: 'Connected', color: 'text-success-500' },
            { name: 'Mapbox / OpenStreetMap', status: 'Active (OpenStreetMap)', color: 'text-success-500' },
            { name: 'Weather API', status: 'Not connected — falling back to reference data', color: 'text-amber-500' },
            { name: 'AQI API', status: 'Not connected — falling back to reference data', color: 'text-amber-500' },
            { name: 'AI Model', status: 'Rule-based v1', color: 'text-info-500' },
          ].map((src) => (
            <div key={src.name} className="flex items-center justify-between p-3 surface-2 rounded-lg">
              <span className="text-sm font-medium">{src.name}</span>
              <span className={`text-xs ${src.color}`}>{src.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 surface-2 rounded-lg">
          <p className="text-xs text-muted">
            To connect real APIs, add the following environment variables: <code className="text-primary-500">VITE_MAPBOX_TOKEN</code>,{' '}
            <code className="text-primary-500">VITE_WEATHER_API_KEY</code>, <code className="text-primary-500">VITE_AQI_API_KEY</code>
          </p>
        </div>
      </div>

      {/* Coverage info */}
      <div className="surface p-5">
        <p className="kicker mb-3">Monitoring coverage</p>
        <div className="grid grid-cols-2 gap-px bg-[var(--color-border)] rounded-lg overflow-hidden border border-[var(--color-border)]">
          <div className="bg-[var(--color-surface)] px-4 py-3.5">
            <p className="metric-value text-[22px] leading-none">{INDIA_CITIES.length}</p>
            <p className="kicker mt-1.5">Cities monitored</p>
          </div>
          <div className="bg-[var(--color-surface)] px-4 py-3.5">
            <p className="metric-value text-[22px] leading-none">{new Set(INDIA_CITIES.map((c) => c.state)).size}</p>
            <p className="kicker mt-1.5">States covered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
