import type {
  Hotspot,
  AqiObservation,
  WeatherObservation,
  EnvironmentalAlert,
  SourcePrediction,
  RiskLevel,
  AlertSeverity,
  SourceType,
} from '@/types';
import { INDIA_CITIES } from '@/data/indiaData';

const SOURCES: SourceType[] = [
  'agriculture',
  'livestock',
  'landfill',
  'wastewater',
  'oil_gas',
  'coal_mining',
  'wetlands',
  'industrial',
];

const SOURCE_CONTEXTS: Record<SourceType, string[]> = {
  agriculture: ['rice cultivation patterns', 'crop residue burning activity', 'fertilizer application zone'],
  livestock: ['dense cattle population area', 'dairy farm cluster', 'animal husbandry region'],
  landfill: ['proximity to waste-management site', 'urban dump zone', 'municipal solid waste area'],
  wastewater: ['treatment plant vicinity', 'sewage network cluster', 'urban drainage zone'],
  oil_gas: ['natural gas infrastructure nearby', 'refinery corridor', 'pipeline network area'],
  coal_mining: ['coal belt region', 'open-cast mining zone', 'pithead extraction area'],
  wetlands: ['marshland and waterlogged zone', 'floodplain ecosystem', 'wetland habitat area'],
  industrial: ['heavy industry cluster', 'manufacturing zone', 'chemical processing corridor'],
  unknown: ['unclassified environmental signature', 'diffuse emission source'],
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function randomBetween(min: number, max: number, seed: number): number {
  return min + seededRandom(seed) * (max - min);
}

function riskFromMethane(methane: number): RiskLevel {
  if (methane < 1900) return 'low';
  if (methane < 2100) return 'moderate';
  if (methane < 2400) return 'high';
  return 'critical';
}

function severityFromRisk(risk: RiskLevel): AlertSeverity {
  if (risk === 'low') return 'low';
  if (risk === 'moderate') return 'medium';
  if (risk === 'high') return 'high';
  return 'critical';
}

export function generateDemoHotspots(count = 24): Hotspot[] {
  const hotspots: Hotspot[] = [];
  for (let i = 0; i < count; i++) {
    const city = pick(INDIA_CITIES, i + 1);
    const offset = seededRandom(i + 100) * 0.5 - 0.25;
    const methane = Math.round(randomBetween(1850, 2500, i + 200));
    const source = pick(SOURCES, i + 300);
    const confidence = Math.round(randomBetween(55, 95, i + 400));
    const risk = riskFromMethane(methane);
    const timestamp = new Date(Date.now() - i * 3600000 * 3).toISOString();

    hotspots.push({
      id: `demo-hs-${i}`,
      hotspot_code: `MH-${String(i + 1).padStart(3, '0')}`,
      name: `${city.name} Zone ${i + 1}`,
      state: city.state,
      district: null,
      latitude: city.latitude + offset,
      longitude: city.longitude + offset * 1.3,
      methane_index: methane,
      methane_unit: 'ppb',
      confidence_score: confidence,
      risk_level: risk,
      probable_source: source,
      data_source: 'simulated',
      detection_timestamp: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
  return hotspots;
}

export function generateDemoAqiObservations(): AqiObservation[] {
  return INDIA_CITIES.slice(0, 20).map((city, i) => {
    const aqi = Math.round(randomBetween(40, 380, i + 500));
    const dominant = pick(['pm25', 'pm10', 'no2', 'o3'], i + 600);
    const timestamp = new Date(Date.now() - i * 1800000).toISOString();
    return {
      id: `demo-aqi-${i}`,
      city: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      aqi,
      aqi_category: null,
      dominant_pollutant: dominant,
      pm25: Math.round(randomBetween(10, 200, i + 700)),
      pm10: Math.round(randomBetween(20, 300, i + 800)),
      no2: Math.round(randomBetween(5, 80, i + 900)),
      so2: Math.round(randomBetween(2, 50, i + 1000)),
      co: Math.round(randomBetween(0.2, 3, i + 1100) * 10) / 10,
      o3: Math.round(randomBetween(10, 120, i + 1200)),
      data_source: 'simulated',
      observed_at: timestamp,
      created_at: timestamp,
    };
  });
}

export function generateDemoWeatherObservations(): WeatherObservation[] {
  return INDIA_CITIES.slice(0, 20).map((city, i) => {
    const timestamp = new Date(Date.now() - i * 1800000).toISOString();
    return {
      id: `demo-wx-${i}`,
      city: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      temperature: Math.round(randomBetween(15, 40, i + 1300) * 10) / 10,
      humidity: Math.round(randomBetween(30, 90, i + 1400)),
      wind_speed: Math.round(randomBetween(2, 25, i + 1500) * 10) / 10,
      wind_direction: Math.round(randomBetween(0, 359, i + 1600)),
      pressure: Math.round(randomBetween(990, 1020, i + 1700)),
      rainfall: Math.round(randomBetween(0, 30, i + 1800) * 10) / 10,
      cloud_coverage: Math.round(randomBetween(0, 100, i + 1900)),
      data_source: 'simulated',
      observed_at: timestamp,
      created_at: timestamp,
    };
  });
}

export function generateDemoAlerts(hotspots: Hotspot[]): EnvironmentalAlert[] {
  const alerts: EnvironmentalAlert[] = [];
  const highRisk = hotspots.filter((h) => h.risk_level === 'high' || h.risk_level === 'critical');
  highRisk.slice(0, 10).forEach((h, i) => {
    const severity = severityFromRisk(h.risk_level);
    const timestamp = new Date(Date.now() - i * 7200000).toISOString();
    alerts.push({
      id: `demo-alert-${i}`,
      alert_type: h.risk_level === 'critical' ? 'critical_methane' : 'high_methane',
      severity,
      location_name: h.name,
      state: h.state,
      latitude: h.latitude,
      longitude: h.longitude,
      reason: `Methane index of ${h.methane_index} ${h.methane_unit} detected with ${h.confidence_score}% confidence`,
      recommended_action:
        severity === 'critical'
          ? 'Initiate ground-level verification and coordinate with local environmental authorities'
          : 'Monitor closely and schedule verification survey',
      data_source: 'simulated',
      hotspot_id: h.id,
      is_read: i > 3,
      triggered_at: timestamp,
      created_at: timestamp,
    });
  });
  return alerts;
}

export function generateDemoSourcePredictions(hotspot: Hotspot): SourcePrediction[] {
  const primary = hotspot.probable_source ?? 'unknown';
  const others = SOURCES.filter((s) => s !== primary);
  const primaryProb = Math.round(randomBetween(45, 80, hotspot.latitude * 100));
  const remaining = 100 - primaryProb;
  const predictions: SourcePrediction[] = [];

  predictions.push({
    id: `pred-${hotspot.id}-0`,
    hotspot_id: hotspot.id,
    source_type: primary,
    probability: primaryProb,
    confidence: hotspot.confidence_score,
    explanation: `The detected pattern is more consistent with a ${primary.replace('_', '-')}-related methane source because of the hotspot's geographic characteristics and surrounding land-use information.`,
    model_version: 'rule-based-v1',
    created_at: new Date().toISOString(),
  });

  others.slice(0, 4).forEach((s, i) => {
    const prob = Math.round((remaining / 4) * (1 - i * 0.15));
    predictions.push({
      id: `pred-${hotspot.id}-${i + 1}`,
      hotspot_id: hotspot.id,
      source_type: s,
      probability: Math.max(1, prob),
      confidence: hotspot.confidence_score - 10,
      explanation: null,
      model_version: 'rule-based-v1',
      created_at: new Date().toISOString(),
    });
  });

  return predictions;
}

export function generateMethaneTrend(days: number, baseValue: number, seed: number) {
  const trend: { date: string; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - (days - i) * 86400000);
    const variance = (seededRandom(i + seed) - 0.5) * 200;
    trend.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue + variance + i * 1.5),
    });
  }
  return trend;
}

export function generateAqiTrend(days: number, baseValue: number, seed: number) {
  const trend: { date: string; aqi: number; pm25: number; pm10: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - (days - i) * 86400000);
    const variance = (seededRandom(i + seed) - 0.5) * 80;
    const aqi = Math.round(Math.max(20, baseValue + variance));
    trend.push({
      date: date.toISOString().split('T')[0],
      aqi,
      pm25: Math.round(aqi * 0.5),
      pm10: Math.round(aqi * 0.7),
    });
  }
  return trend;
}

export function generateWeatherTrend(hours: number, baseTemp: number, seed: number) {
  const trend: { time: string; temperature: number; humidity: number; windSpeed: number }[] = [];
  for (let i = 0; i < hours; i++) {
    const time = new Date(Date.now() - (hours - i) * 3600000);
    const tempVar = Math.sin((i / hours) * Math.PI) * 8;
    trend.push({
      time: time.toISOString(),
      temperature: Math.round((baseTemp + tempVar + (seededRandom(i + seed) - 0.5) * 2) * 10) / 10,
      humidity: Math.round(50 + (seededRandom(i + seed + 100) - 0.5) * 30),
      windSpeed: Math.round((5 + (seededRandom(i + seed + 200) - 0.5) * 10) * 10) / 10,
    });
  }
  return trend;
}

export { SOURCE_CONTEXTS };
