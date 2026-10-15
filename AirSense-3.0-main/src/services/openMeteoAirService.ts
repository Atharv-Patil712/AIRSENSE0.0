export interface OpenMeteoCurrentAirQuality {
  time: string;
  pm2_5: number;
  pm10: number;
  carbon_monoxide: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
  methane: number | null;
  european_aqi: number;
  us_aqi: number;
}

interface OpenMeteoHourlyAirQuality {
  time: string[];
  pm2_5: number[];
  pm10: number[];
  carbon_monoxide: number[];
  nitrogen_dioxide: number[];
  sulphur_dioxide: number[];
  ozone: number[];
  methane: (number | null)[];
  european_aqi: number[];
  us_aqi: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;

  current: OpenMeteoCurrentAirQuality;

  hourly: OpenMeteoHourlyAirQuality;
}

class OpenMeteoAirService {
  async getAirQuality(
    latitude: number,
    longitude: number
  ): Promise<OpenMeteoResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),

      current: [
        'pm2_5',
        'pm10',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'methane',
        'european_aqi',
        'us_aqi',
      ].join(','),

      hourly: [
        'pm2_5',
        'pm10',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'methane',
        'european_aqi',
        'us_aqi',
      ].join(','),

      timezone: 'auto',
      forecast_days: '5',
    });

    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`
    );

    if (!response.ok) {
      throw new Error(
        `Open-Meteo Air Quality API error: ${response.status}`
      );
    }

    return response.json();
  }

  async getCurrentAirQuality(
    latitude: number,
    longitude: number
  ): Promise<OpenMeteoCurrentAirQuality> {
    const data = await this.getAirQuality(latitude, longitude);

    return data.current;
  }

  async getHourlyAirQuality(
    latitude: number,
    longitude: number
  ): Promise<OpenMeteoHourlyAirQuality> {
    const data = await this.getAirQuality(latitude, longitude);

    return data.hourly;
  }
}

export const openMeteoAirService = new OpenMeteoAirService();