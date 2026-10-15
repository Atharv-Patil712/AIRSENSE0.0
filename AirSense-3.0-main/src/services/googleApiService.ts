import { supabase } from '@/lib/supabase';

export interface GoogleApiError {
  error: string;
  details?: unknown;
}

export interface GeocodingResult {
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

export interface ReverseGeocodingResult {
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

class GoogleApiService {
  private async proxy<T>(endpoint: string, params?: Record<string, string>): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-api-proxy`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ endpoint, params }),
      });

      if (!response.ok) {
        const errorBody: GoogleApiError = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 503) {
          return { data: null, error: 'Google API key is not configured. Contact the administrator.', status: 503 };
        }
        if (response.status === 429) {
          return { data: null, error: 'Google API quota exceeded. Please try again later.', status: 429 };
        }
        if (response.status === 403) {
          return { data: null, error: 'Google API access denied. The API may not be enabled or the key may be restricted.', status: 403 };
        }

        return { data: null, error: errorBody.error ?? `Request failed (${response.status})`, status: response.status };
      }

      const data: T = await response.json();
      return { data, error: null, status: 200 };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Network error while contacting Google API proxy.',
        status: 0,
      };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<{ data: ReverseGeocodingResult | null; error: string | null }> {
    const latlng = `${latitude},${longitude}`;
    const result = await this.proxy<{
      results: { formatted_address: string; address_components: { long_name: string; short_name: string; types: string[] }[] }[];
      status: string;
    }>('https://maps.googleapis.com/maps/api/geocode/json', { latlng, result_type: 'administrative_area_level_1|administrative_area_level_2|locality|sublocality' });

    if (result.error) return { data: null, error: result.error };
    if (!result.data) return { data: null, error: 'No geocoding results returned.' };

    if (result.data.status === 'ZERO_RESULTS') {
      return { data: null, error: 'No address found for these coordinates.' };
    }
    if (result.data.status !== 'OK') {
      return { data: null, error: `Google Geocoding API returned: ${result.data.status}` };
    }

    const topResult = result.data.results[0];
    if (!topResult) return { data: null, error: 'No geocoding results found.' };

    return {
      data: {
        formatted_address: topResult.formatted_address,
        address_components: topResult.address_components,
      },
      error: null,
    };
  }

  async geocode(address: string): Promise<{ data: GeocodingResult | null; error: string | null }> {
    const result = await this.proxy<{
      results: {
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        place_id: string;
        address_components: { long_name: string; short_name: string; types: string[] }[];
      }[];
      status: string;
    }>('https://maps.googleapis.com/maps/api/geocode/json', { address });

    if (result.error) return { data: null, error: result.error };
    if (!result.data) return { data: null, error: 'No geocoding results returned.' };

    if (result.data.status === 'ZERO_RESULTS') {
      return { data: null, error: 'No location found for this address.' };
    }

    const topResult = result.data.results[0];
    if (!topResult) return { data: null, error: 'No geocoding results found.' };

    return {
      data: {
        formatted_address: topResult.formatted_address,
        latitude: topResult.geometry.location.lat,
        longitude: topResult.geometry.location.lng,
        place_id: topResult.place_id,
        address_components: topResult.address_components,
      },
      error: null,
    };
  }

  async getAirQuality(latitude: number, longitude: number): Promise<{ data: { aqi: number | null; index: string | null } | null; error: string | null }> {
    const result = await this.proxy<{
      indexes: { code: string; displayName: string; aqi: number; aqiDisplay: string }[];
    }>('https://airquality.googleapis.com/v1/currentConditions:lookup', {
      'location.latitude': String(latitude),
      'location.longitude': String(longitude),
    });

    if (result.error) return { data: null, error: result.error };
    if (!result.data) return { data: null, error: 'No air quality data returned.' };

    const index = result.data.indexes?.[0];
    if (!index) return { data: null, error: 'No air quality index available for this location.' };

    return {
      data: { aqi: index.aqi, index: index.code },
      error: null,
    };
  }
}

export const googleApiService = new GoogleApiService();
