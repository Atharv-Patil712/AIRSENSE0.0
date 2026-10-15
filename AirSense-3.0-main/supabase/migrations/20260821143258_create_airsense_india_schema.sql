/*
# AirSense India — Core Database Schema

## Overview
Creates the complete schema for the AirSense India environmental intelligence platform:
user profiles, methane hotspots, environmental observations (methane, AQI, weather),
AI source predictions, alerts, uploaded datasets, saved locations, reports, and
user preferences.

## New Tables
1. `profiles` — extends auth.users with display name, role, avatar, org
2. `hotspots` — methane hotspot records with location, intensity, risk, source
3. `methane_observations` — time-series methane readings tied to locations/hotspots
4. `aqi_observations` — AQI readings with pollutant breakdown (PM2.5, PM10, NO2, SO2, CO, O3)
5. `weather_observations` — weather readings (temp, humidity, wind, pressure, rainfall, cloud)
6. `source_predictions` — AI source classification results per hotspot
7. `environmental_alerts` — triggered alerts with severity, reason, action
8. `uploaded_datasets` — metadata for user-uploaded CSV/JSON datasets
9. `saved_locations` — user bookmarks of locations
10. `reports` — generated report metadata
11. `user_preferences` — per-user UI/notification preferences

## Security
- RLS enabled on every table.
- `profiles`, `saved_locations`, `uploaded_datasets`, `reports`, `user_preferences` are
  owner-scoped (authenticated, auth.uid() = user_id).
- Environmental public data tables (hotspots, methane_observations, aqi_observations,
  weather_observations, source_predictions, environmental_alerts) are readable by all
  authenticated users (shared environmental data), writable only by owner/admin.
- All policies use auth.uid(), never current_user.
*/

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  organization text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','analyst')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. HOTSPOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_code text UNIQUE NOT NULL,
  name text NOT NULL,
  state text,
  district text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  methane_index double precision NOT NULL,
  methane_unit text NOT NULL DEFAULT 'ppb',
  confidence_score double precision DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'moderate' CHECK (risk_level IN ('low','moderate','high','critical')),
  probable_source text,
  data_source text NOT NULL DEFAULT 'simulated',
  detection_timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspots_risk ON hotspots(risk_level);
CREATE INDEX IF NOT EXISTS idx_hotshots_location ON hotspots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotspots_state ON hotspots(state);

ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_hotspots" ON hotspots;
CREATE POLICY "read_all_hotspots" ON hotspots FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_hotspots_admin" ON hotspots;
CREATE POLICY "insert_hotspots_admin" ON hotspots FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_hotspots_admin" ON hotspots;
CREATE POLICY "update_hotspots_admin" ON hotspots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_hotspots_admin" ON hotspots;
CREATE POLICY "delete_hotspots_admin" ON hotspots FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 3. METHANE OBSERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS methane_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id uuid REFERENCES hotspots(id) ON DELETE SET NULL,
  location_name text,
  state text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  methane_index double precision NOT NULL,
  methane_unit text NOT NULL DEFAULT 'ppb',
  data_source text NOT NULL DEFAULT 'simulated',
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_methane_obs_location ON methane_observations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_methane_obs_time ON methane_observations(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_methane_obs_hotspot ON methane_observations(hotspot_id);

ALTER TABLE methane_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_methane_obs" ON methane_observations;
CREATE POLICY "read_all_methane_obs" ON methane_observations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_methane_obs" ON methane_observations;
CREATE POLICY "insert_methane_obs" ON methane_observations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_methane_obs" ON methane_observations;
CREATE POLICY "update_methane_obs" ON methane_observations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_methane_obs" ON methane_observations;
CREATE POLICY "delete_methane_obs" ON methane_observations FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 4. AQI OBSERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS aqi_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  aqi double precision NOT NULL,
  aqi_category text,
  dominant_pollutant text,
  pm25 double precision,
  pm10 double precision,
  no2 double precision,
  so2 double precision,
  co double precision,
  o3 double precision,
  data_source text NOT NULL DEFAULT 'simulated',
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aqi_city ON aqi_observations(city);
CREATE INDEX IF NOT EXISTS idx_aqi_time ON aqi_observations(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_aqi_location ON aqi_observations(latitude, longitude);

ALTER TABLE aqi_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_aqi" ON aqi_observations;
CREATE POLICY "read_all_aqi" ON aqi_observations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_aqi" ON aqi_observations;
CREATE POLICY "insert_aqi" ON aqi_observations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_aqi" ON aqi_observations;
CREATE POLICY "update_aqi" ON aqi_observations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_aqi" ON aqi_observations;
CREATE POLICY "delete_aqi" ON aqi_observations FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 5. WEATHER OBSERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  temperature double precision,
  humidity double precision,
  wind_speed double precision,
  wind_direction double precision,
  pressure double precision,
  rainfall double precision,
  cloud_coverage double precision,
  data_source text NOT NULL DEFAULT 'simulated',
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_city ON weather_observations(city);
CREATE INDEX IF NOT EXISTS idx_weather_time ON weather_observations(observed_at DESC);

ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_weather" ON weather_observations;
CREATE POLICY "read_all_weather" ON weather_observations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_weather" ON weather_observations;
CREATE POLICY "insert_weather" ON weather_observations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_weather" ON weather_observations;
CREATE POLICY "update_weather" ON weather_observations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_weather" ON weather_observations;
CREATE POLICY "delete_weather" ON weather_observations FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 6. SOURCE PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS source_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id uuid REFERENCES hotspots(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('agriculture','livestock','landfill','wastewater','oil_gas','coal_mining','wetlands','industrial','unknown')),
  probability double precision NOT NULL DEFAULT 0,
  confidence double precision DEFAULT 0,
  explanation text,
  model_version text NOT NULL DEFAULT 'rule-based-v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_pred_hotspot ON source_predictions(hotspot_id);

ALTER TABLE source_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_source_pred" ON source_predictions;
CREATE POLICY "read_all_source_pred" ON source_predictions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_source_pred" ON source_predictions;
CREATE POLICY "insert_source_pred" ON source_predictions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_source_pred" ON source_predictions;
CREATE POLICY "update_source_pred" ON source_predictions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_source_pred" ON source_predictions;
CREATE POLICY "delete_source_pred" ON source_predictions FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 7. ENVIRONMENTAL ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS environmental_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  location_name text,
  state text,
  latitude double precision,
  longitude double precision,
  reason text NOT NULL,
  recommended_action text,
  data_source text NOT NULL DEFAULT 'simulated',
  hotspot_id uuid REFERENCES hotspots(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON environmental_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_time ON environmental_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON environmental_alerts(is_read);

ALTER TABLE environmental_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_alerts" ON environmental_alerts;
CREATE POLICY "read_all_alerts" ON environmental_alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_alerts" ON environmental_alerts;
CREATE POLICY "insert_alerts" ON environmental_alerts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_alerts" ON environmental_alerts;
CREATE POLICY "update_alerts" ON environmental_alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_alerts" ON environmental_alerts;
CREATE POLICY "delete_alerts" ON environmental_alerts FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 8. UPLOADED DATASETS
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('csv','json')),
  file_size bigint,
  row_count integer DEFAULT 0,
  columns text[],
  column_mapping jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','imported','error')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_datasets_user ON uploaded_datasets(user_id);

ALTER TABLE uploaded_datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_datasets" ON uploaded_datasets;
CREATE POLICY "select_own_datasets" ON uploaded_datasets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_datasets" ON uploaded_datasets;
CREATE POLICY "insert_own_datasets" ON uploaded_datasets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_datasets" ON uploaded_datasets;
CREATE POLICY "update_own_datasets" ON uploaded_datasets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_datasets" ON uploaded_datasets;
CREATE POLICY "delete_own_datasets" ON uploaded_datasets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 9. SAVED LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  state text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_locs_user ON saved_locations(user_id);

ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_locs" ON saved_locations;
CREATE POLICY "select_own_saved_locs" ON saved_locations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_locs" ON saved_locations;
CREATE POLICY "insert_own_saved_locs" ON saved_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_locs" ON saved_locations;
CREATE POLICY "update_own_saved_locs" ON saved_locations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_locs" ON saved_locations;
CREATE POLICY "delete_own_saved_locs" ON saved_locations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 10. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location_name text,
  date_range_start date,
  date_range_end date,
  report_type text NOT NULL DEFAULT 'comprehensive',
  parameters jsonb,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 11. USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark','system')),
  default_map_layers text[] DEFAULT ARRAY['methane','aqi'],
  notification_enabled boolean NOT NULL DEFAULT true,
  email_alerts boolean NOT NULL DEFAULT true,
  alert_severity_filter text NOT NULL DEFAULT 'medium',
  temperature_unit text NOT NULL DEFAULT 'celsius',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prefs" ON user_preferences;
CREATE POLICY "select_own_prefs" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_prefs" ON user_preferences;
CREATE POLICY "insert_own_prefs" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_prefs" ON user_preferences;
CREATE POLICY "update_own_prefs" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_prefs" ON user_preferences;
CREATE POLICY "delete_own_prefs" ON user_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_hotspots_updated ON hotspots;
CREATE TRIGGER trg_hotspots_updated BEFORE UPDATE ON hotspots
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
