import type { RiskLevel } from '@/types';

/* ──────────────────────────────────────────────────────────────
   Cinematic visual identity — semantic data colours.

   The experience intentionally keeps its own severity ramp instead
   of the application palette in @/data/indiaData: the marketing
   surface uses brighter, display-grade hues while dashboards keep
   their print-friendly set. Same semantics, different register.

   Environmental semantics survive the redesign: green-family hues
   still mean "clean / low risk" — they simply no longer brand the
   product. Obsidian + ice cyan do that.
   ────────────────────────────────────────────────────────────── */

/** Severity ramp for risk levels and methane hotspots. */
export const SEVERITY_COLORS: Record<RiskLevel, string> = {
  low: '#5EEAD4',
  moderate: '#FACC15',
  high: '#FB923C',
  critical: '#F43F5E',
};

/** Display-grade AQI scale: clean teal → lime → amber → orange → rose. */
export const AQI_SCALE_COLORS: string[] = [
  '#5EEAD4', // 0–50    Good
  '#BEF264', // 51–100  Satisfactory
  '#FACC15', // 101–200 Moderate
  '#FB923C', // 201–300 Poor
  '#F87171', // 301–400 Very Poor
  '#F43F5E', // 401–500 Severe
];

/** CPCB bands on the cinematic scale — exported for the AQI stage's segmented bar. */
export interface AqiCategoryBand {
  range: [number, number];
  label: string;
}

export const AQI_BANDS: AqiCategoryBand[] = [
  { range: [0, 50], label: 'Good' },
  { range: [51, 100], label: 'Satisfactory' },
  { range: [101, 200], label: 'Moderate' },
  { range: [201, 300], label: 'Poor' },
  { range: [301, 400], label: 'Very Poor' },
  { range: [401, 500], label: 'Severe' },
];

const AQI_CEILING = 500;

/** Colour for an AQI value on the cinematic scale. */
export function aqiColor(value: number): string {
  const band = AQI_BANDS.find((c) => value >= c.range[0] && value <= c.range[1]);
  if (band) return AQI_SCALE_COLORS[AQI_BANDS.indexOf(band)];
  return value > AQI_CEILING
    ? AQI_SCALE_COLORS[AQI_SCALE_COLORS.length - 1]
    : AQI_SCALE_COLORS[0];
}

/** Fallback dot colour — "clean" teal, never brand cyan. */
export const FALLBACK_SEVERITY_COLOR = SEVERITY_COLORS.low;
