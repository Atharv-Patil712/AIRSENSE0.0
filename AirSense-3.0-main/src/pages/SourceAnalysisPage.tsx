import { useEffect, useState } from 'react';
import { methaneService } from '@/services/methaneService';
import { aqiService } from '@/services/aqiService';
import { weatherService } from '@/services/weatherService';
import { aiService } from '@/services/aiService';
import type { Hotspot, AqiObservation, WeatherObservation, AIAnalysisResult } from '@/types';
import { SOURCE_TYPE_LABELS, RISK_COLORS } from '@/data/indiaData';
import { SOURCE_CONTEXTS } from '@/data/demoData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SourceAnalysisPage() {
  usePageTitle('Source analysis');
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [aqiData, setAqiData] = useState<AqiObservation[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherObservation[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [hsRes, aqiRes, wxRes] = await Promise.all([
        methaneService.getHotspots(),
        aqiService.getAqiObservations(),
        weatherService.getWeatherObservations(),
      ]);
      setHotspots(hsRes.data);
      setAqiData(aqiRes.data);
      setWeatherData(wxRes.data);
      setIsDemo(hsRes.isDemo);
      setSelectedHotspot(hsRes.data[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedHotspot) {
      const result = aiService.analyze({
        hotspot: selectedHotspot,
        aqi: aqiData.find((a) => a.state === selectedHotspot.state) ?? null,
        weather: weatherData.find((w) => w.state === selectedHotspot.state) ?? null,
      });
      setAnalysis(result);
    }
  }, [selectedHotspot, aqiData, weatherData]);

  if (loading) return <LoadingSpinner label="Loading source analysis…" />;

  const sources = analysis?.probableSources ?? [];
  const maxProb = Math.max(...sources.map((s) => s.probability), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Source analysis"
        description="Probable methane emission source attribution for each hotspot"
        meta={<MetaLine>Rule-based model v1</MetaLine>}
        actions={<DemoBadge show={isDemo} label="Source attribution" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hotspot selector */}
        <Panel flush title="Hotspots" className="self-start">
          <ul className="max-h-[520px] overflow-y-auto scrollbar-thin py-1">
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

        {/* Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {selectedHotspot && analysis && (
            <>
              <Panel className="animate-fade-up">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="kicker mb-1">Attribution profile</p>
                    <h2 className="text-xl font-semibold tracking-tight">{selectedHotspot.name}</h2>
                    <p className="text-[13px] text-secondary mt-0.5">{selectedHotspot.state}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="status-dot" style={{ backgroundColor: RISK_COLORS[analysis.riskLevel] }} />
                    <span className="text-[13px] capitalize font-medium" style={{ color: RISK_COLORS[analysis.riskLevel] }}>
                      {analysis.riskLevel} risk
                    </span>
                    <span className="mono-label uppercase text-muted ml-2">{analysis.confidence}% conf.</span>
                  </div>
                </div>

                {/* Ranked probability list — single hue, no rainbow */}
                <p className="kicker mb-3">Probable sources</p>
                <ul className="space-y-3">
                  {sources.map((s, i) => {
                    const context = SOURCE_CONTEXTS[s.source as keyof typeof SOURCE_CONTEXTS];
                    const contextText = Array.isArray(context) ? context[0] : context;
                    return (
                      <li key={s.source}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className={`text-[13px] ${i === 0 ? 'font-medium' : 'text-secondary'}`}>
                            {SOURCE_TYPE_LABELS[s.source]}
                            {i === 0 && <span className="mono-label uppercase text-muted ml-2">Leading</span>}
                          </span>
                          <span className="metric-value text-[13px]">{s.probability}%</span>
                        </div>
                        <div className="h-[5px] rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-prediction-500 transition-[width] duration-500"
                            style={{
                              width: `${(s.probability / maxProb) * 100}%`,
                              opacity: i === 0 ? 1 : 0.45 + (0.55 * (sources.length - i)) / sources.length,
                            }}
                          />
                        </div>
                        {i === 0 && contextText && (
                          <p className="text-[11.5px] text-muted mt-1.5 leading-relaxed">
                            Typical indicators — {contextText}.
                          </p>
                        )}
                      </li>
                    );
                  })}
                  {sources.length === 0 && (
                    <li className="text-sm text-muted py-6 text-center">No attribution available for this site.</li>
                  )}
                </ul>

                {/* Detection confidence meter */}
                {analysis && (
                  <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                    <ConfidenceBar value={analysis.confidence} label="Detection confidence" tone="violet" />
                  </div>
                )}
              </Panel>

              <Panel title="AI insights" className="animate-fade-up">
                <ul className="space-y-2.5">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="w-3 h-px bg-primary-500 mt-[9px] flex-shrink-0" />
                      <p className="text-secondary leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
                {analysis.contributingFactors.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                    <p className="kicker mb-2.5">Contributing factors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.contributingFactors.map((f, i) => (
                        <span key={i} className="badge badge-violet">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              {/* Provenance footer */}
              <p className="text-xs text-muted px-1">
                Model <span className="font-mono">{analysis?.modelVersion ?? 'rule-based-v1'}</span> · inputs: hotspot + AQI + weather ·{' '}
                {selectedHotspot?.data_source === 'simulated' ? 'reference dataset' : 'live observations'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
