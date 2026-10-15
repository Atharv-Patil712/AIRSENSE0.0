export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DataSource = 'satellite' | 'government' | 'weather_api' | 'aqi_api' | 'user_uploaded' | 'simulated';
export type SourceType =
  | 'agriculture'
  | 'livestock'
  | 'landfill'
  | 'wastewater'
  | 'oil_gas'
  | 'coal_mining'
  | 'wetlands'
  | 'industrial'
  | 'unknown';
export type UserRole = 'user' | 'admin' | 'analyst';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Hotspot {
  id: string;
  hotspot_code: string;
  name: string;
  state: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  methane_index: number;
  methane_unit: string;
  confidence_score: number;
  risk_level: RiskLevel;
  probable_source: SourceType | null;
  data_source: string;
  detection_timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface MethaneObservation {
  id: string;
  hotspot_id: string | null;
  location_name: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  methane_index: number;
  methane_unit: string;
  data_source: string;
  observed_at: string;
  created_at: string;
}

export interface AqiObservation {
  id: string;
  city: string;
  state: string | null;
  latitude: number;
  longitude: number;
  aqi: number;
  aqi_category: string | null;
  dominant_pollutant: string | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  data_source: string;
  observed_at: string;
  created_at: string;
}

export interface WeatherObservation {
  id: string;
  city: string;
  state: string | null;
  latitude: number;
  longitude: number;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  pressure: number | null;
  rainfall: number | null;
  cloud_coverage: number | null;
  data_source: string;
  observed_at: string;
  created_at: string;
}

export interface SourcePrediction {
  id: string;
  hotspot_id: string | null;
  source_type: SourceType;
  probability: number;
  confidence: number;
  explanation: string | null;
  model_version: string;
  created_at: string;
}

export interface EnvironmentalAlert {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  location_name: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  reason: string;
  recommended_action: string | null;
  data_source: string;
  hotspot_id: string | null;
  is_read: boolean;
  triggered_at: string;
  created_at: string;
}

export interface UploadedDataset {
  id: string;
  user_id: string;
  filename: string;
  file_type: 'csv' | 'json';
  file_size: number | null;
  row_count: number;
  columns: string[] | null;
  column_mapping: Record<string, string> | null;
  status: 'pending' | 'validated' | 'imported' | 'error';
  description: string | null;
  created_at: string;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  state: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  location_name: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  report_type: string;
  parameters: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  theme: ThemeMode;
  default_map_layers: string[];
  notification_enabled: boolean;
  email_alerts: boolean;
  alert_severity_filter: AlertSeverity;
  temperature_unit: 'celsius' | 'fahrenheit';
  created_at: string;
  updated_at: string;
}

export interface AIAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  probableSources: { source: SourceType; probability: number }[];
  confidence: number;
  insights: string[];
  contributingFactors: string[];
  modelVersion: string;
  disclaimer: string;
}

export interface PredictionResult {
  predictedRisk: RiskLevel;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  contributingFactors: string[];
  prediction: string;
  modelConfidence: number;
  horizon: string;
}

export interface IndiaCity {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface MapLayerConfig {
  methane: boolean;
  aqi: boolean;
  weather: boolean;
  sources: boolean;
  riskZones: boolean;
}
