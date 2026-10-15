import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { methaneService } from '@/services/methaneService';
import { aqiService } from '@/services/aqiService';
import { weatherService } from '@/services/weatherService';
import type { Hotspot, AqiObservation, WeatherObservation, MapLayerConfig } from '@/types';
import { INDIA_CENTER, INDIA_BOUNDS, RISK_COLORS, getAqiCategory, SOURCE_TYPE_LABELS } from '@/data/indiaData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { FavoriteStar } from '@/components/ui/FavoriteStar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { X } from 'lucide-react';

/** Weather is an informational layer, not a risk category. */
const CHART_WEATHER = 'var(--color-primary-bg)';

export function MapPage() {
  usePageTitle('Methane map');
  const [searchParams] = useSearchParams();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [aqiData, setAqiData] = useState<AqiObservation[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherObservation[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [layers, setLayers] = useState<MapLayerConfig>({
    methane: true,
    aqi: true,
    weather: false,
    sources: false,
    riskZones: true,
  });
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [hsRes, aqiRes, wxRes] = await Promise.all([
        methaneService.getHotspots(),
        aqiService.getAqiObservations(),
        weatherService.getWeatherObservations(),
      ]);
      setHotspots(hsRes.data);
      setAqiData(aqiRes.data);
      setWeatherData(wxRes.data);
      setIsDemo(hsRes.isDemo || aqiRes.isDemo);
      setLoading(false);
    }
    loadData();
  }, []);

  const center = useMemo(() => {
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng] as [number, number];
    return [INDIA_CENTER.lat, INDIA_CENTER.lng] as [number, number];
  }, [searchParams]);

  if (loading) return <LoadingSpinner label="Loading map data..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Methane map"
        description="Interactive view of hotspots, air quality stations, weather and risk zones"
        meta={<MetaLine>{hotspots.length} sites · {aqiData.length} stations</MetaLine>}
        actions={<DemoBadge show={isDemo} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Layer rail */}
        <aside className="surface shadow-panel p-5 space-y-5 lg:max-h-[640px] overflow-y-auto scrollbar-thin">
          <div>
            <p className="kicker mb-2.5">Layers</p>
            <ul className="space-y-px -mx-2">
              {([
                { key: 'methane', label: 'Methane hotspots' },
                { key: 'aqi', label: 'AQI stations' },
                { key: 'weather', label: 'Weather' },
                { key: 'sources', label: 'Emission sources' },
                { key: 'riskZones', label: 'Risk zones' },
              ] as const).map((layer) => (
                <li key={layer.key}>
                  <label className="flex items-center gap-2.5 px-2 py-[7px] rounded-md hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={layers[layer.key]}
                      onChange={(e) => setLayers({ ...layers, [layer.key]: e.target.checked })}
                    />
                    <span className="text-[13px] text-secondary">{layer.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kicker mb-2.5">Base map</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['street', 'satellite'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={`py-1.5 rounded-md text-[13px] capitalize border transition-colors ${
                    mapStyle === style
                      ? 'border-primary-500/60 bg-[var(--color-primary-soft)] text-[var(--color-primary-text)] font-medium'
                      : 'border-[var(--color-border-strong)] text-secondary hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="kicker mb-2.5">Risk scale</p>
            <ul className="space-y-1.5">
              {Object.entries(RISK_COLORS).map(([level, color]) => (
                <li key={level} className="flex items-center gap-2 text-xs text-secondary capitalize">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {level}
                </li>
              ))}
              <li className="flex items-center gap-2 text-xs text-secondary pt-1.5 mt-1 border-t border-[var(--color-border)]">
                <span
                  className="w-2 h-2 rounded-full border"
                  style={{ borderColor: 'var(--color-good) var(--color-moderate) var(--color-critical) var(--color-severe)' }}
                  title="Station color indicates AQI severity"
                />
                AQI station
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)]">
            <p className="mono-label uppercase text-muted leading-relaxed">
              {layers.methane && `${hotspots.length} hotspots`}
              {layers.methane && layers.aqi && ' · '}
              {layers.aqi && `${aqiData.length} stations`}
              {layers.weather && weatherData.length > 0 && ' · '}
              {layers.weather && `${weatherData.length} weather`}
            </p>
          </div>
        </aside>

        {/* Map canvas */}
        <div className="lg:col-span-3 surface shadow-panel !p-1.5 relative">
          <div className="h-[600px] rounded-lg overflow-hidden relative">
            <MapContainer
              center={center}
              zoom={5}
              minZoom={4}
              maxBounds={INDIA_BOUNDS}
              className="w-full h-full"
              scrollWheelZoom
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked={mapStyle === 'street'} name="Street Map">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked={mapStyle === 'satellite'} name="Satellite">
                  <TileLayer
                    className="air-satellite-tile"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <ScaleControl position="bottomleft" />

              {/* Methane hotspots — sized by concentration, quiet strokes */}
              {layers.methane && hotspots.map((h) => (
                <CircleMarker
                  key={h.id}
                  center={[h.latitude, h.longitude]}
                  radius={Math.min(Math.max(4.5 + (h.methane_index - 1850) / 55, 4), 11)}
                  pathOptions={{
                    color: RISK_COLORS[h.risk_level],
                    fillColor: RISK_COLORS[h.risk_level],
                    fillOpacity: 0.82,
                    weight: 1.5,
                    opacity: 0.9,
                  }}
                  eventHandlers={{ click: () => setSelectedHotspot(h) }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{h.name}</p>
                      <p>Methane: {h.methane_index} {h.methane_unit}</p>
                      <p>Risk: <span style={{ color: RISK_COLORS[h.risk_level] }}>{h.risk_level}</span></p>
                      {h.probable_source && <p>Source: {SOURCE_TYPE_LABELS[h.probable_source]}</p>}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* AQI stations — hollow rings */}
              {layers.aqi && aqiData.map((a) => {
                const cat = getAqiCategory(a.aqi);
                return (
                  <CircleMarker
                    key={a.id}
                    center={[a.latitude, a.longitude]}
                    radius={4}
                    pathOptions={{ color: cat.color, fillColor: cat.color, fillOpacity: 0.18, weight: 2, opacity: 1 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{a.city}</p>
                        <p>AQI: {a.aqi} ({cat.label})</p>
                        {a.dominant_pollutant && <p>Dominant: {a.dominant_pollutant.toUpperCase()}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Weather stations */}
              {layers.weather && weatherData.map((w) => (
                <CircleMarker
                  key={w.id}
                  center={[w.latitude, w.longitude]}
                  radius={3.5}
                  pathOptions={{ color: CHART_WEATHER, fillColor: CHART_WEATHER, fillOpacity: 0.22, weight: 1, opacity: 0.7 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{w.city}</p>
                      <p>Temp: {w.temperature}°C</p>
                      <p>Wind: {w.wind_speed} km/h</p>
                      <p>Humidity: {w.humidity}%</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Risk zones — faint contextual halos */}
              {layers.riskZones && hotspots
                .filter((h) => h.risk_level === 'high' || h.risk_level === 'critical')
                .map((h) => (
                  <CircleMarker
                    key={`risk-${h.id}`}
                    center={[h.latitude, h.longitude]}
                    radius={18}
                    interactive={false}
                    pathOptions={{
                      color: RISK_COLORS[h.risk_level],
                      fillColor: RISK_COLORS[h.risk_level],
                      fillOpacity: 0.05,
                      weight: 1,
                      opacity: 0.3,
                    }}
                  />
                ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Hotspot detail drawer */}
      {selectedHotspot && (
        <div className="fixed inset-0 z-50 animate-overlay-in" style={{ background: 'var(--overlay)' }} onClick={() => setSelectedHotspot(null)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-drawer overflow-y-auto scrollbar-thin animate-drawer-in"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="sticky top-0 bg-[var(--color-surface)] flex items-start justify-between gap-3 px-6 py-4 border-b border-[var(--color-border)]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: RISK_COLORS[selectedHotspot.risk_level] }}
                  />
                  <span className="kicker">{selectedHotspot.hotspot_code} · {selectedHotspot.risk_level}</span>
                </div>
                <h2 className="text-[17px] font-semibold tracking-tight truncate flex items-center gap-2">
                  {selectedHotspot.name}
                  <FavoriteStar
                    name={selectedHotspot.name}
                    state={selectedHotspot.state}
                    latitude={selectedHotspot.latitude}
                    longitude={selectedHotspot.longitude}
                  />
                </h2>
                <p className="text-xs text-muted mt-0.5">{selectedHotspot.state}</p>
              </div>
              <button onClick={() => setSelectedHotspot(null)} className="btn-ghost !p-1.5 -mr-1.5" aria-label="Close panel">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="px-6 py-5">
              {/* Primary reading */}
              <div className="flex items-baseline gap-2 pb-5 mb-5 border-b border-[var(--color-border)]">
                <span className="metric-value text-[32px] leading-none" style={{ color: RISK_COLORS[selectedHotspot.risk_level] }}>
                  {selectedHotspot.methane_index}
                </span>
                <span className="text-sm text-muted">{selectedHotspot.methane_unit} methane</span>
                <span className="ml-auto mono-label uppercase text-muted">
                  {selectedHotspot.confidence_score}% conf.
                </span>
              </div>

              <dl className="divide-rule">
                <DetailRow label="Probable source" value={selectedHotspot.probable_source ? SOURCE_TYPE_LABELS[selectedHotspot.probable_source] : 'Unknown'} />
                <DetailRow label="Detection" value={selectedHotspot.data_source === 'simulated' ? 'Reference' : 'Satellite'} />
                <DetailRow
                  label="Coordinates"
                  value={`${selectedHotspot.latitude.toFixed(3)}, ${selectedHotspot.longitude.toFixed(3)}`}
                  mono
                  action={
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${selectedHotspot.latitude}, ${selectedHotspot.longitude}`)
                          .then(() => {
                            setCopiedCoords(true);
                            setTimeout(() => setCopiedCoords(false), 1600);
                          })
                          .catch(() => {});
                      }}
                      className="btn-ghost !text-[10.5px] !px-1.5 !py-0.5 ml-2 flex-shrink-0"
                      aria-label="Copy coordinates"
                    >
                      {copiedCoords ? 'Copied' : 'Copy'}
                    </button>
                  }
                />
                <DetailRow label="Recorded" value={new Date(selectedHotspot.detection_timestamp).toLocaleString()} />
              </dl>

            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`flex items-center text-[13px] font-medium text-right ${mono ? 'mono-label' : ''}`}>
        {value}
        {action}
      </dd>
    </div>
  );
}
