import type { AqiObservation, Hotspot, WeatherObservation } from '@/types';
import { aiService } from '@/services/aiService';
import { predictionService } from '@/services/predictionService';
import { getAqiCategory } from '@/data/indiaData';
import {
  generateAqiTrend,
  generateDemoAqiObservations,
  generateDemoHotspots,
  generateDemoWeatherObservations,
} from '@/data/demoData';
import type { CinematicData, CinematicPlume, CinematicSite } from './types';

/* ─────────────────────────────────────────────────────────────
   Turns raw AirSense observations into the cinematic contract.

   All numbers come from the existing services (or their existing
   demo fallbacks) — nothing is invented here. The only derived
   values are descriptive: percentage change across the observed
   window, and the plume vector (wind blows FROM a bearing, so the
   plume travels TOWARD bearing + 180°).
   ────────────────────────────────────────────────────────────── */

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Methane level at which the prototype risk model moves off "low" (ppb). */
const METHANE_THRESHOLD = 1900;

/** Plain-language reading of each CPCB AQI category. */
const CATEGORY_MEANING: Record<string, string> = {
  Good: 'Air quality poses little or no risk to the general population.',
  Satisfactory: 'Minor breathing discomfort is possible for sensitive groups on prolonged exposure.',
  Moderate: 'Breathing discomfort is likely for people with respiratory or cardiac conditions, children and older adults.',
  Poor: 'Breathing discomfort for most people on prolonged exposure — outdoor exertion should be limited.',
  'Very Poor': 'Respiratory illness risk even for healthy people on prolonged exposure — outdoor activity should be avoided.',
  Severe: 'Serious health impact for everyone — indoor shelter and filtration are advised.',
};

export interface CinematicDataInput {
  hotspots: Hotspot[];
  aqi: AqiObservation[];
  weather: WeatherObservation[];
  aqiTrend?: { aqi: number }[];
  isDemo: boolean;
}

export function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function cardinalOf(deg: number): string {
  return CARDINALS[Math.round(normalizeBearing(deg) / 22.5) % 16];
}

function toSite(hotspot: Hotspot): CinematicSite {
  return {
    id: hotspot.id,
    name: hotspot.name,
    state: hotspot.state,
    latitude: hotspot.latitude,
    longitude: hotspot.longitude,
    value: hotspot.methane_index,
    level: hotspot.risk_level,
    source: hotspot.probable_source,
  };
}

/** Signed percentage change between the first and last third of a series. */
function percentChange(values: number[]): number | null {
  if (values.length < 4) return null;
  const slice = Math.max(1, Math.floor(values.length / 3));
  const start = values.slice(0, slice);
  const end = values.slice(-slice);
  const startAvg = start.reduce((sum, v) => sum + v, 0) / start.length;
  const endAvg = end.reduce((sum, v) => sum + v, 0) / end.length;
  if (!startAvg) return null;
  return Math.round(((endAvg - startAvg) / startAvg) * 100);
}
export function buildCinematicData(input: CinematicDataInput): CinematicData {
  const { hotspots, aqi, weather, aqiTrend = [], isDemo } = input;

  const byMethane = [...hotspots].sort((a, b) => b.methane_index - a.methane_index);
  const peak = byMethane[0] ?? null;
  const sites = byMethane.slice(0, 6).map(toSite);

  const current = aqi[0] ?? null;
  const worst = [...aqi].sort((a, b) => b.aqi - a.aqi)[0] ?? null;
  const category = current ? getAqiCategory(current.aqi) : null;
  const trendDelta = percentChange(aqiTrend.map((point) => point.aqi));

  const methaneValues = hotspots.map((hotspot) => hotspot.methane_index);
  const methaneMean = methaneValues.length
    ? Math.round(methaneValues.reduce((sum, value) => sum + value, 0) / methaneValues.length)
    : 0;

  const windFrom = normalizeBearing(weather[0]?.wind_direction ?? 0);
  const windSpeed = weather[0]?.wind_speed ?? 0;
  const windTo = normalizeBearing(windFrom + 180);
  const dispersal =
    windSpeed >= 15 ? 'Rapid dispersal' : windSpeed >= 5 ? 'Steady transport' : 'Slow accumulation';

  const plume: CinematicPlume = {
    city: weather[0]?.city ?? current?.city ?? 'Monitoring network',
    windFrom,
    windFromCardinal: cardinalOf(windFrom),
    windTo,
    windToCardinal: cardinalOf(windTo),
    windSpeed,
    dispersal,
  };

  // Existing prototype models, unchanged — the cinematic layer only presents them.
  const analysis = peak
    ? aiService.analyze({ hotspot: peak, aqi: current, weather: weather[0] ?? null })
    : null;

  const projection = peak
    ? predictionService.predict({
        hotspot: peak,
        aqi: current,
        weather: weather[0] ?? null,
        location: peak.name,
      })
    : null;

  const categoryLabel = category?.label ?? 'Unclassified';

  const changeSentence = current
    ? trendDelta !== null && trendDelta !== 0
      ? `Air quality in ${current.city} moved ${trendDelta > 0 ? 'up' : 'down'} ${Math.abs(trendDelta)}% across the observed window — now AQI ${current.aqi} (${categoryLabel}).`
      : `Air quality in ${current.city} held broadly steady across the observed window at AQI ${current.aqi} (${categoryLabel}).`
    : 'No air-quality observation has landed for the current window.';

  const methaneSentence = peak
    ? ` Methane remains the strongest discrete signal: ${peak.methane_index} ${peak.methane_unit} at ${peak.name} (${peak.risk_level} risk, ${peak.confidence_score}% detection confidence).`
    : '';

  const whyItMatters = [
    `${categoryLabel}: ${CATEGORY_MEANING[categoryLabel] ?? 'Conditions are monitored against the CPCB category scale.'}`,
    current?.dominant_pollutant
      ? `${current.dominant_pollutant.toUpperCase()} is the dominant pollutant, so measures aimed at that fraction move the index fastest.`
      : '',
    'Methane is reported outside the AQI scale — it is a greenhouse-gas indicator, not a CPCB AQI pollutant, so it is never folded into the index above.',
  ]
    .filter(Boolean)
    .join(' ');

  const whatNext = projection
    ? `${projection.prediction} Horizon ${projection.horizon}, trend assessed ${projection.trend} at ${projection.modelConfidence}% model confidence.`
    : 'Insufficient historical depth for a forward projection in the current window.';

  const modelVersion = 'rule-based-v1 · trend-projection-v1';

  return {
    brand: {
      name: 'AirSense',
      descriptor: 'Environmental Intelligence',
      tagline: 'Understand Today. Protect Tomorrow.',
    },
    environment: {
      updatedAt: Date.now(),
      cityCount: new Set(aqi.map((observation) => observation.city)).size,
      stationCount: aqi.length,
      hotspotCount: hotspots.length,
      sources: [
        { label: 'Open-Meteo', detail: 'Air quality & pollutant concentrations' },
        { label: 'CPCB AQI method', detail: 'Sub-index breakpoint interpolation' },
        { label: 'Observation store', detail: 'Hotspot & weather records' },
        { label: 'Prototype models', detail: 'rule-based-v1 · trend-projection-v1' },
      ],
    },
    aqi: {
      city: current?.city ?? 'Monitoring network',
      value: current?.aqi ?? 0,
      category: categoryLabel,
      color: category?.color ?? '#4C8A64',
      pm25: current?.pm25 ?? null,
      pm10: current?.pm10 ?? null,
      no2: current?.no2 ?? null,
      o3: current?.o3 ?? null,
      dominantPollutant: current?.dominant_pollutant ?? null,
      trendDelta,
      window: aqiTrend.length >= 12 ? 'Rolling observation window' : 'Latest observation',
      worst: worst ? { city: worst.city, value: worst.aqi, category: getAqiCategory(worst.aqi).label } : null,
    },
    plume,
    methane: {
      unit: peak?.methane_unit ?? 'ppb',
      peak: peak?.methane_index ?? 0,
      peakSite: peak?.name ?? null,
      mean: methaneMean,
      threshold: METHANE_THRESHOLD,
      sites,
    },
    risk: {
      index: analysis?.riskScore ?? 0,
      level: analysis?.riskLevel ?? 'low',
      confidence: analysis?.confidence ?? 0,
      factors: analysis?.contributingFactors.length
        ? analysis.contributingFactors
        : ['Insufficient observations for factor attribution'],
      method: modelVersion,
    },
    brief: {
      whatChanged: `${changeSentence}${methaneSentence}`,
      whyItMatters,
      whatNext,
      modelVersion,
      disclaimer: `${
        analysis?.disclaimer ??
        'AI-generated source classification is an estimate and should be independently verified.'
      } Not a regulatory determination.`,
    },
    isDemo,
  };
}

/**
 * Fallback contract built from the project's existing demo generators, so the
 * experience renders complete and self-contained when mounted without props.
 */
export function createFallbackCinematicData(): CinematicData {
  return buildCinematicData({
    hotspots: generateDemoHotspots(),
    aqi: generateDemoAqiObservations(),
    weather: generateDemoWeatherObservations(),
    aqiTrend: generateAqiTrend(30, 150, 11),
    isDemo: true,
  });
}

export const FALLBACK_CINEMATIC_DATA = createFallbackCinematicData();
