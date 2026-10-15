export interface PollutantValues {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface CpcbAqiResult {
  aqi: number;
  category: string;
  dominantPollutant: string;
  subIndices: Record<string, number>;
}

interface Breakpoint {
  low: number;
  high: number;
  aqiLow: number;
  aqiHigh: number;
}

/**
 * CPCB-style linear interpolation.
 *
 * The breakpoint ranges intentionally overlap at their boundaries
 * (e.g. 0–30 and 30–60) so there are no gaps between concentrations.
 */
function calculateSubIndex(
  concentration: number,
  breakpoint: Breakpoint
): number {
  const { low, high, aqiLow, aqiHigh } = breakpoint;

  if (concentration <= low) {
    return aqiLow;
  }

  if (concentration >= high) {
    return aqiHigh;
  }

  const index =
    ((aqiHigh - aqiLow) / (high - low)) *
      (concentration - low) +
    aqiLow;

  return Math.round(index);
}

function calculatePollutantAqi(
  concentration: number,
  breakpoints: Breakpoint[]
): number {
  for (const breakpoint of breakpoints) {
    if (
      concentration >= breakpoint.low &&
      concentration <= breakpoint.high
    ) {
      return calculateSubIndex(concentration, breakpoint);
    }
  }

  // Below the first breakpoint
  if (concentration < breakpoints[0].low) {
    return breakpoints[0].aqiLow;
  }

  // Above the final breakpoint
  return breakpoints[breakpoints.length - 1].aqiHigh;
}

/*
 * CPCB AQI concentration breakpoints.
 *
 * PM2.5, PM10, NO2 and SO2 are expressed in µg/m³.
 * CO is converted from µg/m³ to mg/m³ before calculation.
 * O3 is expressed in µg/m³.
 */
const BREAKPOINTS = {
  pm25: [
    { low: 0, high: 30, aqiLow: 0, aqiHigh: 50 },
    { low: 30, high: 60, aqiLow: 50, aqiHigh: 100 },
    { low: 60, high: 90, aqiLow: 100, aqiHigh: 200 },
    { low: 90, high: 120, aqiLow: 200, aqiHigh: 300 },
    { low: 120, high: 250, aqiLow: 300, aqiHigh: 400 },
    { low: 250, high: 500, aqiLow: 400, aqiHigh: 500 },
  ],

  pm10: [
    { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
    { low: 50, high: 100, aqiLow: 50, aqiHigh: 100 },
    { low: 100, high: 250, aqiLow: 100, aqiHigh: 200 },
    { low: 250, high: 350, aqiLow: 200, aqiHigh: 300 },
    { low: 350, high: 430, aqiLow: 300, aqiHigh: 400 },
    { low: 430, high: 500, aqiLow: 400, aqiHigh: 500 },
  ],

  no2: [
    { low: 0, high: 40, aqiLow: 0, aqiHigh: 50 },
    { low: 40, high: 80, aqiLow: 50, aqiHigh: 100 },
    { low: 80, high: 180, aqiLow: 100, aqiHigh: 200 },
    { low: 180, high: 280, aqiLow: 200, aqiHigh: 300 },
    { low: 280, high: 400, aqiLow: 300, aqiHigh: 400 },
    { low: 400, high: 500, aqiLow: 400, aqiHigh: 500 },
  ],

  so2: [
    { low: 0, high: 40, aqiLow: 0, aqiHigh: 50 },
    { low: 40, high: 80, aqiLow: 50, aqiHigh: 100 },
    { low: 80, high: 380, aqiLow: 100, aqiHigh: 200 },
    { low: 380, high: 800, aqiLow: 200, aqiHigh: 300 },
    { low: 800, high: 1600, aqiLow: 300, aqiHigh: 400 },
    { low: 1600, high: 2000, aqiLow: 400, aqiHigh: 500 },
  ],

  co: [
    { low: 0, high: 1, aqiLow: 0, aqiHigh: 50 },
    { low: 1, high: 2, aqiLow: 50, aqiHigh: 100 },
    { low: 2, high: 10, aqiLow: 100, aqiHigh: 200 },
    { low: 10, high: 17, aqiLow: 200, aqiHigh: 300 },
    { low: 17, high: 34, aqiLow: 300, aqiHigh: 400 },
    { low: 34, high: 50, aqiLow: 400, aqiHigh: 500 },
  ],

  o3: [
    { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
    { low: 50, high: 100, aqiLow: 50, aqiHigh: 100 },
    { low: 100, high: 168, aqiLow: 100, aqiHigh: 200 },
    { low: 168, high: 208, aqiLow: 200, aqiHigh: 300 },
    { low: 208, high: 748, aqiLow: 300, aqiHigh: 400 },
    { low: 748, high: 1000, aqiLow: 400, aqiHigh: 500 },
  ],
};

export function calculateCpcbAqi(
  pollutants: PollutantValues
): CpcbAqiResult {
  const subIndices: Record<string, number> = {};

  // PM2.5
  subIndices.pm25 = calculatePollutantAqi(
    pollutants.pm25,
    BREAKPOINTS.pm25
  );

  // PM10
  subIndices.pm10 = calculatePollutantAqi(
    pollutants.pm10,
    BREAKPOINTS.pm10
  );

  // NO2
  subIndices.no2 = calculatePollutantAqi(
    pollutants.no2,
    BREAKPOINTS.no2
  );

  // SO2
  subIndices.so2 = calculatePollutantAqi(
    pollutants.so2,
    BREAKPOINTS.so2
  );

  // CO
  // Open-Meteo returns CO in µg/m³.
  // CPCB breakpoints are expressed in mg/m³.
  const coMgPerM3 = pollutants.co / 1000;

  subIndices.co = calculatePollutantAqi(
    coMgPerM3,
    BREAKPOINTS.co
  );

  // O3
  subIndices.o3 = calculatePollutantAqi(
    pollutants.o3,
    BREAKPOINTS.o3
  );

  /*
   * CPCB AQI is determined by the highest valid
   * pollutant sub-index.
   */
  const dominantEntry = Object.entries(subIndices).reduce(
    (highest, current) =>
      current[1] > highest[1] ? current : highest
  );

  const aqi = dominantEntry[1];
  const dominantPollutant = dominantEntry[0];

  let category = 'Good';

  if (aqi > 400) {
    category = 'Severe';
  } else if (aqi > 300) {
    category = 'Very Poor';
  } else if (aqi > 200) {
    category = 'Poor';
  } else if (aqi > 100) {
    category = 'Moderate';
  } else if (aqi > 50) {
    category = 'Satisfactory';
  }

  return {
    aqi,
    category,
    dominantPollutant,
    subIndices,
  };
}