import { useEffect, useMemo, useState } from 'react';
import { Search, Navigation, Droplets, Wind, Compass, Gauge, CloudRain, CloudSun } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';
import { weatherService } from '@/services/weatherService';
import { aqiService } from '@/services/aqiService';
import type { WeatherObservation } from '@/types';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { FavoriteStar } from '@/components/ui/FavoriteStar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { pearson, describeCorrelation } from '@/lib/stats';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  CHART_COLORS,
  chartTick,
  chartAxisLine,
  chartGridStroke,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from '@/components/ui/chartTheme';

type CorrVar = 'temperature' | 'humidity' | 'wind';

const CORR_VARS: { value: CorrVar; label: string; unit: string; color: string }[] = [
  { value: 'temperature', label: 'Temperature', unit: '°C', color: CHART_COLORS.orange },
  { value: 'humidity', label: 'Humidity', unit: '%', color: CHART_COLORS.secondary },
  { value: 'wind', label: 'Wind speed', unit: 'km/h', color: CHART_COLORS.primary },
];


export function WeatherPage() {
  usePageTitle('Weather');
  const [weatherData, setWeatherData] = useState<WeatherObservation[]>([]);
  const [aqiByCity, setAqiByCity] = useState<Record<string, number>>({});
  const [selectedCity, setSelectedCity] = useState<WeatherObservation | null>(null);
  const [trend, setTrend] = useState<{ time: string; temperature: number; humidity: number; windSpeed: number }[]>([]);
  const [search, setSearch] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [corrVar, setCorrVar] = useState<CorrVar>('temperature');

  useEffect(() => {
    async function load() {
      const [res, aqiRes] = await Promise.all([
        weatherService.getWeatherObservations(),
        aqiService.getAqiObservations(),
      ]);
      setWeatherData(res.data);
      setIsDemo(res.isDemo);
      setSelectedCity(res.data[0] ?? null);
      const aqiMap: Record<string, number> = {};
      aqiRes.data.forEach((a) => {
        aqiMap[a.city.toLowerCase()] = a.aqi;
      });
      setAqiByCity(aqiMap);
      setLoading(false);
      if (res.data.length > 0) {
        const t = await weatherService.getWeatherTrend(res.data[0].city, 24, res.data[0].temperature ?? 28);
        setTrend(t.data);
      }
    }
    load();
  }, []);

  const handleSelect = async (city: string) => {
    const obs = weatherData.find((w) => w.city === city) ?? null;
    setSelectedCity(obs);
    if (obs) {
      const t = await weatherService.getWeatherTrend(obs.city, 24, obs.temperature ?? 28);
      setTrend(t.data);
    }
  };

  // ── Weather ↔ AQI correlation across paired city observations ──
  const paired = useMemo(
    () =>
      weatherData
        .filter((w) => aqiByCity[w.city.toLowerCase()] !== undefined)
        .map((w) => ({
          city: w.city,
          aqi: aqiByCity[w.city.toLowerCase()],
          temperature: w.temperature ?? 0,
          humidity: w.humidity ?? 0,
          wind: w.wind_speed ?? 0,
        })),
    [weatherData, aqiByCity],
  );

  const correlations = useMemo(
    () =>
      CORR_VARS.map((v) => ({
        ...v,
        r: pearson(
          paired.map((p) => (v.value === 'wind' ? p.wind : v.value === 'humidity' ? p.humidity : p.temperature)),
          paired.map((p) => p.aqi),
        ),
      })),
    [paired],
  );

  if (loading) return <LoadingSpinner label="Loading weather data…" />;

  const filtered = weatherData.filter((w) => w.city.toLowerCase().includes(search.toLowerCase()));
  const trendData = trend.map((t) => ({
    ...t,
    time: new Date(t.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }));

  const activeCorr = correlations.find((c) => c.value === corrVar) ?? correlations[0];
  const scatterData = paired.map((p) => ({
    x: corrVar === 'wind' ? p.wind : corrVar === 'humidity' ? p.humidity : p.temperature,
    y: p.aqi,
    city: p.city,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Weather"
        description="Atmospheric conditions across the monitoring network"
        meta={<MetaLine>{weatherData.length} ground stations</MetaLine>}
        actions={<DemoBadge show={isDemo} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Station list */}
        <Panel flush className="self-start">
          <div className="px-5 pb-2 pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter stations…"
                className="input-field !py-[6px] !pl-8 text-[13px]"
              />
            </div>
          </div>
          <ul className="max-h-[440px] overflow-y-auto scrollbar-thin py-1">
            {filtered.map((w) => {
              const isActive = selectedCity?.id === w.id;
              return (
                <li key={w.id}>
                  <button
                    onClick={() => handleSelect(w.city)}
                    className={`w-full flex items-center justify-between px-5 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-[var(--color-primary-soft)]' : 'hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isActive ? 'text-[var(--color-primary-text)]' : ''}`}>{w.city}</p>
                      <p className="text-[11px] text-muted">{w.state}</p>
                    </span>
                    <span className="metric-value text-[15px] ml-3">{w.temperature}°</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted">No stations match “{search}”</li>
            )}
          </ul>
        </Panel>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCity && (
            <>
              <Panel className="animate-fade-up">
                <div className="flex items-start justify-between mb-6">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      Live Ground Station
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                      {selectedCity.city}
                      <FavoriteStar
                        name={selectedCity.city}
                        state={selectedCity.state}
                        latitude={selectedCity.latitude}
                        longitude={selectedCity.longitude}
                      />
                    </h2>
                    <p className="text-[13px] text-secondary mt-0.5">{selectedCity.state} • Telemetry sensor reporting</p>
                  </div>
                  <div className="text-right">
                    <p className="metric-value text-[44px] font-bold leading-none bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {selectedCity.temperature}°C
                    </p>
                    <p className="text-xs text-muted mt-1 font-medium">Feels like {Math.round((selectedCity.temperature ?? 0) - 1)}°C</p>
                  </div>
                </div>

                {/* Weather condition cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 border-t border-[var(--color-border)]/70 pt-5">
                  {[
                    { label: 'Humidity', value: `${selectedCity.humidity}%`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Wind', value: `${selectedCity.wind_speed}`, unit: 'km/h', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    { label: 'Direction', value: `${selectedCity.wind_direction}°`, icon: Compass, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Pressure', value: `${selectedCity.pressure}`, unit: 'hPa', icon: Gauge, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Rainfall', value: `${selectedCity.rainfall}`, unit: 'mm', icon: CloudRain, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { label: 'Cloud', value: `${selectedCity.cloud_coverage}%`, icon: CloudSun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="group p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/60 hover:bg-[var(--color-surface)] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="kicker !text-[10px] text-muted group-hover:text-[var(--color-text)] transition-colors">{s.label}</span>
                          <div className={`p-1 rounded-md ${s.bg} ${s.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                        </div>
                        <p className="metric-value text-[16px] font-bold leading-none">
                          {s.value}
                          {s.unit && <span className="text-[10px] text-muted font-normal ml-0.5">{s.unit}</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="24-hour trend" description="Temperature and humidity" className="animate-fade-up">
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                    <CartesianGrid stroke={chartGridStroke} vertical={false} />
                    <XAxis dataKey="time" tick={chartTick} axisLine={chartAxisLine} tickLine={false} interval={4} dy={4} />
                    <YAxis tick={chartTick} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                      cursor={{ stroke: 'var(--color-border-strong)' }}
                    />
                    <Line type="monotone" dataKey="temperature" stroke={CHART_COLORS.orange} strokeWidth={1.75} dot={false} name="Temp (°C)" activeDot={{ r: 3, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="humidity" stroke={CHART_COLORS.secondary} strokeWidth={1.5} dot={false} name="Humidity (%)" activeDot={{ r: 3, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>

              {/* Weather ↔ AQI correlation */}
              {paired.length >= 5 && activeCorr && (
                <Panel
                  title="Environment correlation"
                  description={`AQI vs weather across ${paired.length} paired city observations`}
                  className="animate-fade-up"
                >
                  <SegmentedControl<CorrVar>
                    size="sm"
                    ariaLabel="Correlation variable"
                    value={corrVar}
                    onChange={setCorrVar}
                    options={CORR_VARS.map((v) => ({ value: v.value, label: v.label }))}
                    className="mb-4"
                  />

                  <div className="grid sm:grid-cols-[1fr_180px] gap-5 items-start">
                    <ResponsiveContainer width="100%" height={190}>
                      <ScatterChart margin={{ top: 6, right: 10, bottom: 2, left: -18 }}>
                        <CartesianGrid stroke={chartGridStroke} />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={activeCorr.label}
                          tick={chartTick}
                          axisLine={chartAxisLine}
                          tickLine={false}
                          domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <YAxis type="number" dataKey="y" name="AQI" tick={chartTick} axisLine={false} tickLine={false} width={40} />
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-border-strong)' }}
                          content={({ payload }) => {
                            if (!payload || payload.length === 0) return null;
                            const point = payload[0].payload as { x: number; y: number; city: string };
                            return (
                              <div style={tooltipContentStyle}>
                                <p style={tooltipLabelStyle}>{point.city}</p>
                                <p>
                                  AQI <span className="tnum font-medium">{point.y}</span> · {activeCorr.label}{' '}
                                  <span className="tnum font-medium">
                                    {point.x}
                                    {activeCorr.unit}
                                  </span>
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Scatter
                          data={scatterData}
                          fill={activeCorr.color}
                          fillOpacity={0.55}
                          stroke={activeCorr.color}
                          strokeOpacity={0.8}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>

                    {/* Coefficients */}
                    <ul className="space-y-3">
                      {correlations.map((c) => (
                        <li key={c.value}>
                          <button
                            onClick={() => setCorrVar(c.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                              c.value === corrVar
                                ? 'border-[var(--color-primary-text)]/40 bg-[var(--color-primary-soft)]'
                                : 'border-transparent hover:bg-[var(--color-surface-2)]'
                            }`}
                          >
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-xs text-secondary">{c.label}</span>
                              <span className="metric-value text-[14px] tnum">r = {c.r.toFixed(2)}</span>
                            </span>
                            <span className="block text-[10.5px] text-muted mt-0.5">{describeCorrelation(c.r)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[11px] text-muted mt-3 pt-3 border-t border-[var(--color-border)] leading-relaxed">
                    Pearson correlation computed from the current network snapshot — a statistical association, not a
                    causal relationship.
                  </p>
                </Panel>
              )}

              <Panel title="Wind & plume movement" className="animate-fade-up">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 text-center">
                    <div className="w-20 h-20 rounded-full border border-dashed border-[var(--color-border-strong)] grid place-items-center relative">
                      <div className="absolute inset-0 grid place-items-center" style={{ transform: `rotate(${selectedCity.wind_direction}deg)` }}>
                        <Navigation className="w-7 h-7 text-accent-500" strokeWidth={1.5} />
                      </div>
                    </div>
                    <p className="mono-label uppercase text-muted mt-2">{selectedCity.wind_direction}°</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary leading-relaxed max-w-md">
                      Wind is blowing from {selectedCity.wind_direction}° at {selectedCity.wind_speed} km/h.
                      Model-based plume visualization indicates potential methane movement in this direction.
                    </p>
                    <p className="text-[11px] text-muted mt-2.5 flex items-center gap-1.5">
                      <span className="status-dot bg-warning-500" />
                      Wind-driven plume estimate.
                    </p>
                  </div>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
