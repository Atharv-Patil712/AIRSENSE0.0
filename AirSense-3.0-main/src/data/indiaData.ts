import type { IndiaCity } from '@/types';

export const INDIA_CITIES: IndiaCity[] = [
  { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { name: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  { name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', latitude: 22.3072, longitude: 73.1812 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.6692, longitude: 77.4538 },
  { name: 'Ludhiana', state: 'Punjab', latitude: 30.901, longitude: 75.8573 },
  { name: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081 },
  { name: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
  { name: 'Faridabad', state: 'Haryana', latitude: 28.4089, longitude: 77.3178 },
  { name: 'Meerut', state: 'Uttar Pradesh', latitude: 28.9845, longitude: 77.7064 },
  { name: 'Rajkot', state: 'Gujarat', latitude: 22.3039, longitude: 70.8022 },
  { name: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', latitude: 34.0837, longitude: 74.7973 },
  { name: 'Aurangabad', state: 'Maharashtra', latitude: 19.8762, longitude: 75.3433 },
  { name: 'Amritsar', state: 'Punjab', latitude: 31.634, longitude: 74.8723 },
  { name: 'Jodhpur', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243 },
  { name: 'Raipur', state: 'Chhattisgarh', latitude: 21.2514, longitude: 81.6296 },
  { name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
  { name: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 },
  { name: 'Bhubaneswar', state: 'Odisha', latitude: 20.2961, longitude: 85.8245 },
  { name: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 },
  { name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5241, longitude: 76.9366 },
  { name: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311 },
  { name: 'Ranchi', state: 'Jharkhand', latitude: 23.3441, longitude: 85.3096 },
  { name: 'Jammu', state: 'Jammu and Kashmir', latitude: 32.7266, longitude: 74.857 },
  { name: 'Dehradun', state: 'Uttarakhand', latitude: 30.3165, longitude: 78.0322 },
];

export const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };
export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.4627, 68.1766],
  [35.6746, 97.3956],
];

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  agriculture: 'Agriculture',
  livestock: 'Livestock',
  landfill: 'Landfill',
  wastewater: 'Wastewater',
  oil_gas: 'Oil & Gas',
  coal_mining: 'Coal Mining',
  wetlands: 'Wetlands',
  industrial: 'Industrial',
  unknown: 'Unknown',
};

/**
 * Shared environmental data palette.
 * Restrained severity hues that read identically as information
 * on maps, charts, tables and badges in both themes.
 */

export const RISK_COLORS: Record<string, string> = {
  low: 'var(--color-good)',
  moderate: 'var(--color-moderate)',
  high: 'var(--color-critical)',
  critical: 'var(--color-severe)',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'var(--color-primary-bg)',
  medium: 'var(--color-moderate)',
  high: 'var(--color-warning)',
  critical: 'var(--color-critical)',
};

export const AQI_CATEGORIES = [
  { range: [0, 50], label: 'Good', color: 'var(--color-good)' },
  { range: [51, 100], label: 'Satisfactory', color: 'var(--color-moderate)' },
  { range: [101, 200], label: 'Moderate', color: 'var(--color-moderate)' },
  { range: [201, 300], label: 'Poor', color: 'var(--color-critical)' },
  { range: [301, 400], label: 'Very Poor', color: 'var(--color-critical)' },
  { range: [401, 500], label: 'Severe', color: 'var(--color-severe)' },
];

export function getAqiCategory(aqi: number) {
  return AQI_CATEGORIES.find((c) => aqi >= c.range[0] && aqi <= c.range[1]) ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}
