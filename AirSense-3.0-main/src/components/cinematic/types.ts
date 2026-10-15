import type { RiskLevel } from '@/types';

/* ──────────────────────────────────────────────────────────────
   Cinematic experience — data contract.

   The experience renders from this object alone. It never reaches
   into services, storage or the router itself, so it can be mounted
   on any route and reused with real AirSense data through props.
   ────────────────────────────────────────────────────────────── */

export interface CinematicBrand {
  name: string;
  descriptor: string;
  tagline: string;
}

export interface CinematicProvenance {
  label: string;
  detail: string;
}

export interface CinematicEnvironment {
  updatedAt: number;
  cityCount: number;
  stationCount: number;
  hotspotCount: number;
  sources: CinematicProvenance[];
}

export interface CinematicAqiReading {
  city: string;
  value: number;
  category: string;
}

export interface CinematicAqi {
  city: string;
  value: number;
  category: string;
  color: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  dominantPollutant: string | null;
  /** Signed percentage change across the observed window; null when unknown. */
  trendDelta: number | null;
  window: string;
  worst: CinematicAqiReading | null;
}

export interface CinematicSite {
  id: string;
  name: string;
  state: string | null;
  latitude: number;
  longitude: number;
  value: number;
  level: RiskLevel;
  source?: string | null;
}

export interface CinematicPlume {
  city: string;
  /** Direction the wind blows FROM, degrees clockwise from north (meteorological). */
  windFrom: number;
  windFromCardinal: string;
  /** Direction the plume travels TOWARD — the vector that matters for exposure. */
  windTo: number;
  windToCardinal: string;
  windSpeed: number;
  dispersal: string;
}

export interface CinematicMethane {
  unit: string;
  peak: number;
  peakSite: string | null;
  mean: number;
  threshold: number;
  sites: CinematicSite[];
}

export interface CinematicRisk {
  index: number;
  level: RiskLevel;
  confidence: number;
  factors: string[];
  method: string;
}

export interface CinematicBrief {
  whatChanged: string;
  whyItMatters: string;
  whatNext: string;
  modelVersion: string;
  disclaimer: string;
}

export interface CinematicData {
  brand: CinematicBrand;
  environment: CinematicEnvironment;
  aqi: CinematicAqi;
  plume: CinematicPlume;
  methane: CinematicMethane;
  risk: CinematicRisk;
  brief: CinematicBrief;
  /** True when any upstream observation came from a fallback generator. */
  isDemo: boolean;
}

/* ── Storyboard ───────────────────────────────────────────────── */

export type WorkflowPhase = 'observe' | 'understand' | 'predict' | 'act';

export interface StageMeta {
  id: string;
  kicker: string;
  phase: WorkflowPhase;
}

/** Scroll order of the experience. Array index is the stage id used by the canvas. */
export const STAGES: StageMeta[] = [
  { id: 'hero', kicker: 'AirSense', phase: 'observe' },
  { id: 'environment', kicker: 'Live environment', phase: 'observe' },
  { id: 'aqi', kicker: 'Air quality', phase: 'understand' },
  { id: 'plume', kicker: 'Pollution movement', phase: 'understand' },
  { id: 'methane', kicker: 'Methane', phase: 'understand' },
  { id: 'risk', kicker: 'Environmental risk', phase: 'predict' },
  { id: 'brief', kicker: 'AI environmental brief', phase: 'act' },
  { id: 'enter', kicker: 'Enter AirSense', phase: 'act' },
];

export const STAGE_INDEX: Record<string, number> = STAGES.reduce<Record<string, number>>(
  (acc, stage, index) => {
    acc[stage.id] = index;
    return acc;
  },
  {},
);

export const WORKFLOW: { id: WorkflowPhase; label: string; detail: string }[] = [
  { id: 'observe', label: 'Observe', detail: 'Satellite, station and API observations' },
  { id: 'understand', label: 'Understand', detail: 'Pollutant breakdown, transport and methane' },
  { id: 'predict', label: 'Predict', detail: 'Composite index and contributing factors' },
  { id: 'act', label: 'Act', detail: 'Plain-language brief into the operations dashboard' },
];

/** Mutable scroll state shared between ScrollTrigger and the WebGL scene. */
export interface AtmosphereState {
  stage: number;
  stageMix: number;
  overall: number;
}

export function createAtmosphereState(): AtmosphereState {
  return { stage: 0, stageMix: 0, overall: 0 };
}
