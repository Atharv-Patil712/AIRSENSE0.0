import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ReferenceLine,
} from 'recharts';
import { methaneService } from '@/services/methaneService';
import { aqiService } from '@/services/aqiService';
import { weatherService } from '@/services/weatherService';
import { predictionService } from '@/services/predictionService';
import type { Hotspot, PredictionResult } from '@/types';
import { RISK_COLORS } from '@/data/indiaData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
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

export function PredictionsPage() {
  usePageTitle('Predictions');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [trend, setTrend] = useState<{ date: string; value: number }[]>([]);
  const [forecast, setForecast] = useState<{ date: string; value: number; forecast: boolean }[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await methaneService.getHotspots();
      setHotspots(res.data);
      setIsDemo(res.isDemo);
      setSelectedHotspot(res.data[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function analyze() {
      if (!selectedHotspot) return;
      const trendRes = await methaneService.getMethaneTrend(
        selectedHotspot.latitude,
        selectedHotspot.longitude,
        30,
        selectedHotspot.methane_index,
        42,
      );
      setTrend(trendRes.data);

      const aqiRes = await aqiService.getAqiByCity(selectedHotspot.state ?? '');
      const wxRes = await weatherService.getWeatherByCity(selectedHotspot.state ?? '');

      const result = predictionService.predict({
        hotspot: selectedHotspot,
        aqi: aqiRes.data,
        weather: wxRes.data,
        historicalTrend: trendRes.data,
        location: selectedHotspot.name,
      });
      setPrediction(result);

      // Generate 7-day forecast
      const lastValue = trendRes.data[trendRes.data.length - 1]?.value ?? selectedHotspot.methane_index;
      const fc: { date: string; value: number; forecast: boolean }[] = trendRes.data.map((d) => ({ ...d, forecast: false }));
      const trendDir = result.trend === 'increasing' ? 1 : result.trend === 'decreasing' ? -1 : 0;
      for (let i = 1; i <= 7; i++) {
        const date = new Date(Date.now() + i * 86400000);
        fc.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(lastValue + trendDir * i * 15 + (Math.sin(i) * 10)),
          forecast: true,
        });
      }
      setForecast(fc);
    }
    analyze();
  }, [selectedHotspot]);

  if (loading) return <LoadingSpinner label="Loading predictions…" />;

  const TrendIcon = prediction?.trend === 'increasing' ? TrendingUp : prediction?.trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = prediction?.trend === 'increasing' ? 'text-danger-500' : prediction?.trend === 'decreasing' ? 'text-success-500' : 'text-muted';

  // Split series: solid history, dashed forecast
  const chartData = forecast.map((d) => ({
    date: d.date,
    hist: d.forecast ? null : d.value,
    fc: d.forecast ? d.value : null,
  }));
  const lastHistoryDate = trend[trend.length - 1]?.date;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Predictions"
        description="Environmental risk projection from historical trends and current conditions"
        meta={<MetaLine>Model v1 · trend projection</MetaLine>}
        actions={<DemoBadge show={isDemo} label="Trend projection" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Location selector */}
        <Panel flush title="Location" className="self-start">
          <ul className="max-h-[480px] overflow-y-auto scrollbar-thin py-1">
            {hotspots.map((h) => {
              const isActive = selectedHotspot?.id === h.id;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => setSelectedHotspot(h)}
                    className={`w-full flex items-center justify-between px-5 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-[var(--color-primary-soft)]' : 'hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isActive ? 'text-[var(--color-primary-text)]' : ''}`}>{h.name}</p>
                      <p className="mono-label uppercase text-muted">{h.hotspot_code}</p>
                    </span>
                    <span className="status-dot flex-shrink-0 ml-3" style={{ backgroundColor: RISK_COLORS[h.risk_level] }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Prediction */}
        <div className="lg:col-span-2 space-y-4">
          {selectedHotspot && prediction && (
            <>
              <Panel className="animate-fade-up">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="kicker mb-1">Prediction · {prediction.horizon} horizon</p>
                    <h2 className="text-xl font-semibold tracking-tight">{selectedHotspot.name}</h2>
                  </div>
                  <span className="badge badge-neutral mt-1">Rule-based model</span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4 border-t border-[var(--color-border)] pt-4">
                  <div>
                    <dt className="kicker mb-1">Predicted risk</dt>
                    <dd className="metric-value text-[18px] leading-none capitalize" style={{ color: RISK_COLORS[prediction.predictedRisk] }}>
                      {prediction.predictedRisk}
                    </dd>
                  </div>
                  <div>
                    <dt className="kicker mb-1">Trend</dt>
                    <dd className={`metric-value text-[15px] leading-none capitalize flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="w-4 h-4" />
                      {prediction.trend}
                    </dd>
                  </div>
                  <div>
                    <dt className="kicker mb-1">Confidence</dt>
                    <dd className="metric-value text-[16px] leading-none">{prediction.confidence}%</dd>
                  </div>
                  <div>
                    <dt className="kicker mb-1">Model conf.</dt>
                    <dd className="metric-value text-[16px] leading-none">{prediction.modelConfidence}%</dd>
                  </div>
                </dl>

                {/* Risk band — where the projection sits on the severity scale */}
                <div className="mt-5">
                  <p className="kicker mb-2">Risk level position</p>
                  <div className="flex h-[8px] rounded-full overflow-hidden">
                    {(['low', 'moderate', 'high', 'critical'] as const).map((level) => (
                      <div
                        key={level}
                        className="h-full flex-1"
                        style={{ backgroundColor: RISK_COLORS[level], opacity: prediction.predictedRisk === level ? 0.95 : 0.22 }}
                        title={level}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {(['low', 'moderate', 'high', 'critical'] as const).map((level) => (
                      <span
                        key={level}
                        className={`mono-label uppercase ${prediction.predictedRisk === level ? 'font-semibold' : 'text-muted'}`}
                        style={prediction.predictedRisk === level ? { color: RISK_COLORS[level] } : undefined}
                      >
                        {level === 'moderate' ? 'mod.' : level}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confidence meters */}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5">
                  <ConfidenceBar value={prediction.confidence} label="Prediction confidence" tone="violet" />
                  <ConfidenceBar value={prediction.modelConfidence} label="Model confidence" tone="violet" />
                </div>

                <div className="mt-5 p-4 surface-2 rounded-lg border border-[var(--color-border)]">
                  <p className="text-sm leading-relaxed text-secondary">{prediction.prediction}</p>
                </div>

                {prediction.contributingFactors.length > 0 && (
                  <div className="mt-4">
                    <p className="kicker mb-2">Contributing factors</p>
                    <ul className="space-y-1.5">
                      {prediction.contributingFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className="w-3 h-px bg-primary-500 mt-[9px] flex-shrink-0" />
                          <p className="text-secondary leading-relaxed">{f}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>

              <Panel
                title="Historical data & 7-day forecast"
                description={`${selectedHotspot.name} · methane ${selectedHotspot.methane_unit}`}
                className="animate-fade-up"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primarySoft} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chartGridStroke} vertical={false} />
                    <XAxis dataKey="date" tick={chartTick} axisLine={chartAxisLine} tickLine={false} interval={5} dy={4} />
                    <YAxis tick={chartTick} axisLine={false} tickLine={false} width={36} domain={['dataMin - 40', 'dataMax + 60']} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                      cursor={{ stroke: 'var(--color-border-strong)' }}
                    />
                    {lastHistoryDate && (
                      <ReferenceLine
                        x={lastHistoryDate}
                        stroke="var(--color-border-strong)"
                        strokeDasharray="3 3"
                        label={{ value: 'Forecast', position: 'insideTopRight', fill: 'var(--color-text-muted)', fontSize: 10 }}
                      />
                    )}
                    <Area type="monotone" dataKey="hist" stroke={CHART_COLORS.primary} strokeWidth={1.75} fill="url(#histGrad)" name="Methane (ppb)" connectNulls={false} />
                    <Line type="monotone" dataKey="fc" stroke={CHART_COLORS.prediction} strokeWidth={1.75} strokeDasharray="5 4" dot={false} name="Forecast (ppb)" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>

                <div className="flex gap-5 mt-3 pt-3 border-t border-[var(--color-border)]">
                  <span className="flex items-center gap-1.5 mono-label uppercase text-muted">
                    <span className="w-3.5 h-[2px] rounded bg-primary-500" /> Historical
                  </span>
                  <span className="flex items-center gap-1.5 mono-label uppercase text-muted">
                    <span className="w-3.5 border-t-2 border-dashed border-prediction-500" style={{ height: 0 }} /> Forecast
                  </span>
                </div>
              </Panel>

              <div className="flex items-start gap-2 px-1">
                <span className="status-dot bg-warning-500 mt-[7px] flex-shrink-0" />
                <p className="text-xs text-muted leading-relaxed">
                  Trend-based projection — model confidence {prediction.modelConfidence}%.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

