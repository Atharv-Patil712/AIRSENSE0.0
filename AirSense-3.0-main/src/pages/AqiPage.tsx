import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { aqiService } from '@/services/aqiService';
import type { AqiObservation } from '@/types';
import { AQI_CATEGORIES, getAqiCategory } from '@/data/indiaData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { FavoriteStar } from '@/components/ui/FavoriteStar';
import { mean } from '@/lib/stats';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  CHART_COLORS,
  chartTick,
  chartAxisLine,
  chartGridStroke,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipCursor,
} from '@/components/ui/chartTheme';

/** Public-health interpretation per Indian AQI category (CPCB guidance). */
const AQI_HEALTH_GUIDANCE: Record<string, string> = {
  Good: 'Air quality is satisfactory and poses little or no risk. Outdoor activity is safe for everyone.',
  Satisfactory:
    'Minor breathing discomfort is possible for people with lung or heart conditions during prolonged outdoor exertion.',
  Moderate:
    'Breathing discomfort is likely for people with respiratory or cardiac conditions, children and older adults. Limit prolonged outdoor exertion.',
  Poor: 'Breathing discomfort for most people on prolonged exposure. Move outdoor activity indoors where possible.',
  'Very Poor': 'Respiratory illness risk even for healthy people on prolonged exposure. Avoid outdoor activity.',
  Severe:
    'Serious health impact for everyone. Stay indoors, keep windows closed and use air filtration if available.',
};


export function AqiPage() {
  usePageTitle('Air quality');
  const [aqiData, setAqiData] = useState<AqiObservation[]>([]);
  const [selectedCity, setSelectedCity] = useState<AqiObservation | null>(null);
  const [trend, setTrend] = useState<{ date: string; aqi: number; pm25: number; pm10: number }[]>([]);
  const [search, setSearch] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await aqiService.getAqiObservations();
      setAqiData(res.data);
      setIsDemo(res.isDemo);
      setSelectedCity(res.data[0] ?? null);
      setLoading(false);
      if (res.data.length > 0) {
        const t = await aqiService.getAqiTrend(res.data[0].city, 30);
        setTrend(t.data);
      }
    }
    load();
  }, []);

  const handleCitySelect = async (city: string) => {
    const obs = aqiData.find((a) => a.city === city) ?? null;
    setSelectedCity(obs);
    if (obs) {
      const t = await aqiService.getAqiTrend(obs.city, 30);
      setTrend(t.data);
    }
  };

  // ── AQI intelligence — historical comparison & trend direction ──
  const trendValues = useMemo(() => trend.map((t) => t.aqi), [trend]);

  // Network-wide category distribution (computed from loaded stations)
  const distribution = useMemo(
    () =>
      AQI_CATEGORIES.map((c) => ({
        label: c.label,
        color: c.color,
        count: aqiData.filter((a) => a.aqi >= c.range[0] && a.aqi <= c.range[1]).length,
      })).filter((d) => d.count > 0),
    [aqiData],
  );
  const distributionTotal = distribution.reduce((sum, d) => sum + d.count, 0);

  if (loading) return <LoadingSpinner label="Loading air quality data…" />;

  const cat = selectedCity ? getAqiCategory(selectedCity.aqi) : null;
  const ranked = [...aqiData].sort((a, b) => b.aqi - a.aqi);
  const filtered = ranked.filter((a) => a.city.toLowerCase().includes(search.toLowerCase()));
  const rankOfSelected = selectedCity ? ranked.findIndex((a) => a.id === selectedCity.id) + 1 : 0;
  const pollutantData = selectedCity
    ? [
        { name: 'PM2.5', value: selectedCity.pm25 ?? 0 },
        { name: 'PM10', value: selectedCity.pm10 ?? 0 },
        { name: 'NO2', value: selectedCity.no2 ?? 0 },
        { name: 'SO2', value: selectedCity.so2 ?? 0 },
        { name: 'CO', value: selectedCity.co ?? 0 },
        { name: 'O3', value: selectedCity.o3 ?? 0 },
      ]
    : [];
  const dominantName = selectedCity?.dominant_pollutant?.toUpperCase();

  const currentAqiValue = trendValues[trendValues.length - 1] ?? selectedCity?.aqi ?? null;
  const avg7 = trendValues.length >= 7 ? mean(trendValues.slice(-7)) : null;
  const avg30 = trendValues.length >= 14 ? mean(trendValues) : null;
  const prevWeekAvg = trendValues.length >= 14 ? mean(trendValues.slice(-14, -7)) : null;
  const weekOverWeekPct =
    avg7 !== null && prevWeekAvg !== null && prevWeekAvg !== 0 ? ((avg7 - prevWeekAvg) / prevWeekAvg) * 100 : null;
  const trendDirection =
    weekOverWeekPct === null || Math.abs(weekOverWeekPct) < 3 ? 'stable' : weekOverWeekPct > 0 ? 'up' : 'down';
  const comparisonMax = Math.max(currentAqiValue ?? 0, avg7 ?? 0, avg30 ?? 0, 1);


  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Air quality"
        description="Real-time AQI monitoring across Indian cities"
        meta={<MetaLine>{aqiData.length} stations reporting</MetaLine>}
        actions={<DemoBadge show={isDemo} />}
      />

      {/* Category scale — quiet inline legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {AQI_CATEGORIES.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
            <span className="mono-label text-muted">{c.range[0]}–{c.range[1]}</span>
          </span>
        ))}
      </div>

      {/* Network snapshot — category distribution across monitored stations */}
      {distributionTotal > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[220px] max-w-xl">
            <div className="h-[6px] rounded-full overflow-hidden flex bg-[var(--color-surface-2)]">
              {distribution.map((d) => (
                <div
                  key={d.label}
                  className="h-full transition-all duration-500"
                  style={{ width: `${(d.count / distributionTotal) * 100}%`, backgroundColor: d.color }}
                  title={`${d.label}: ${d.count}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3.5 flex-wrap">
            {distribution.map((d) => (
              <span key={d.label} className="flex items-center gap-1.5 mono-label uppercase text-muted">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label} <span className="tnum">{d.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* City ranking table */}
        <Panel
          className="lg:col-span-3"
          flush
          title="City ranking"
          description="Sorted by current AQI — select to inspect"
          actions={
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter cities…"
                className="input-field !py-[5px] !pl-8 text-[13px]"
              />
            </div>
          }
        >
          <div className="overflow-x-auto scrollbar-thin max-h-[520px] overflow-y-auto">
            <table className="table-data min-w-[480px]">
              <thead className="sticky top-0 bg-[var(--color-surface)] z-10">
                <tr>
                  <th className="!pl-5 w-10">#</th>
                  <th>City</th>
                  <th className="!text-right">AQI</th>
                  <th>Status</th>
                  <th className="!pr-5 text-right">Dominant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const c = getAqiCategory(a.aqi);
                  const isActive = selectedCity?.id === a.id;
                  return (
                    <tr
                      key={a.id}
                      className={`row-click ${isActive ? 'row-active' : ''}`}
                      onClick={() => handleCitySelect(a.city)}
                    >
                      <td className="num !pl-5 text-muted">{String(ranked.indexOf(a) + 1).padStart(2, '0')}</td>
                      <td>
                        <p className={`font-medium ${isActive ? '' : ''}`}>{a.city}</p>
                        <p className="text-[11px] text-muted">{a.state}</p>
                      </td>
                      <td className="num !text-right">
                        <span className="metric-value text-[15px]" style={{ color: c.color }}>{a.aqi}</span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs text-secondary">
                          <span className="status-dot" style={{ backgroundColor: c.color }} />
                          {c.label}
                        </span>
                      </td>
                      <td className="mono-label uppercase text-muted !pr-5 text-right">
                        {a.dominant_pollutant ?? '—'}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="!pl-5 py-10 text-center text-sm text-muted">
                      No cities match “{search}”
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Selected city */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCity && cat && (
            <>
              <Panel className="animate-fade-up">
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <span className="mono-label text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 mb-2 inline-block">
                      Rank #{String(rankOfSelected).padStart(2, '0')} Nationally
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
                      {selectedCity.city}
                      <FavoriteStar
                        name={selectedCity.city}
                        state={selectedCity.state}
                        latitude={selectedCity.latitude}
                        longitude={selectedCity.longitude}
                      />
                    </h2>
                    <p className="text-[13px] text-secondary mt-0.5">{selectedCity.state} • CPCB Station</p>
                  </div>
                  <div className="text-right">
                    <p className="metric-value text-[44px] font-bold leading-none" style={{ color: cat.color }}>
                      {selectedCity.aqi}
                    </p>
                    <span
                      className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                        border: `1px solid ${cat.color}40`,
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--color-border)]/70">
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/60">
                    <p className="kicker !text-[10px] mb-1">Dominant Pollutant</p>
                    <p className="mono-label uppercase text-[15px] font-bold text-[var(--color-text)]">{selectedCity.dominant_pollutant ?? 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/60">
                    <p className="kicker !text-[10px] mb-1">Observation Date</p>
                    <p className="mono-label text-[13px] font-medium text-[var(--color-text)]">{new Date(selectedCity.observed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Panel>

              {/* AQI intelligence — comparison, trend & interpretation */}
              {currentAqiValue !== null && (
                <Panel
                  title="AQI intelligence"
                  description={`${selectedCity.city} · historical comparison and interpretation`}
                  className="animate-fade-up"
                >
                  {/* Trend direction */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
                    <span className="text-[13px] text-muted">Week-over-week direction</span>
                    <TrendIndicator
                      direction={trendDirection}
                      label={weekOverWeekPct !== null ? `${weekOverWeekPct > 0 ? '+' : ''}${weekOverWeekPct.toFixed(1)}%` : undefined}
                    />
                  </div>

                  {/* Historical comparison — current vs 7-day vs 30-day */}
                  <p className="kicker mb-3">Historical comparison</p>
                  <ul className="space-y-2.5 mb-5">
                    {[
                      { label: 'Current', value: currentAqiValue, emphasized: true },
                      { label: '7-day avg', value: avg7, emphasized: false },
                      { label: '30-day avg', value: avg30, emphasized: false },
                    ]
                      .filter((row) => row.value !== null)
                      .map((row) => (
                        <li key={row.label} className="flex items-center gap-3">
                          <span className={`w-[68px] flex-shrink-0 text-xs ${row.emphasized ? 'font-medium' : 'text-muted'}`}>
                            {row.label}
                          </span>
                          <div className="flex-1 h-[6px] rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${row.emphasized ? '' : 'opacity-50'}`}
                              style={{
                                width: `${((row.value ?? 0) / comparisonMax) * 100}%`,
                                backgroundColor: cat?.color,
                              }}
                            />
                          </div>
                          <span className="metric-value text-[13px] w-9 text-right tnum">{Math.round(row.value ?? 0)}</span>
                        </li>
                      ))}
                  </ul>

                  {/* Health interpretation */}
                  {cat && AQI_HEALTH_GUIDANCE[cat.label] && (
                    <div className="pt-4 border-t border-[var(--color-border)]">
                      <p className="kicker mb-2">Health Guidance</p>
                      <div
                        className="p-3.5 rounded-xl border leading-relaxed text-[13px]"
                        style={{
                          backgroundColor: `${cat.color}10`,
                          borderColor: `${cat.color}35`,
                        }}
                      >
                        <p className="font-medium text-[var(--color-text)]">{AQI_HEALTH_GUIDANCE[cat.label]}</p>
                      </div>
                      <p className="text-[10.5px] text-muted mt-2">
                        Official CPCB standard advisories • Public health reference
                      </p>
                    </div>
                  )}
                </Panel>
              )}

              <Panel title="Pollutant breakdown" description="Concentration by pollutant · dominant highlighted" className="animate-fade-up">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={pollutantData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                    <CartesianGrid stroke={chartGridStroke} vertical={false} />
                    <XAxis dataKey="name" tick={chartTick} axisLine={chartAxisLine} tickLine={false} dy={4} />
                    <YAxis tick={chartTick} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                      cursor={tooltipCursor}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} name="µg/m³">
                      {pollutantData.map((p) => (
                        <Cell key={p.name} fill={p.name === dominantName ? CHART_COLORS.orange : CHART_COLORS.secondary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="30-day trend" description="AQI compared with PM2.5" className="animate-fade-up">
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                    <CartesianGrid stroke={chartGridStroke} vertical={false} />
                    <XAxis dataKey="date" tick={chartTick} axisLine={chartAxisLine} tickLine={false} interval={6} dy={4} />
                    <YAxis tick={chartTick} axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                      cursor={{ stroke: 'var(--color-border-strong)' }}
                    />
                    <Line type="monotone" dataKey="aqi" stroke={CHART_COLORS.primary} strokeWidth={1.75}
                      dot={(props) => (
                        <circle key={props.key} cx={props.cx} cy={props.cy} r={2.5}
                          fill={getAqiCategory(props.payload.aqi).color} stroke="var(--color-surface)" strokeWidth={1} />
                      )}
                      name="AQI" activeDot={{ r: 3, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="pm25" stroke={CHART_COLORS.secondary} strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="PM2.5" activeDot={{ r: 3, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
