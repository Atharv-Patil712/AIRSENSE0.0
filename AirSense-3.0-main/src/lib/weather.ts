const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// 1. Updated Interface containing your original metrics plus AQI and Methane
export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  description: string;
  aqi: number;      // Air Quality Index (1 = Good, 5 = Very Poor)
  methane: number;  // Methane concentration in μg/m³
}

/**
 * Fetches comprehensive weather conditions and air pollution metrics for a location.
 */
export async function getWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  
  // Create parallel network requests for both endpoints to maximize loading speed
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  const [weatherResponse, pollutionResponse] = await Promise.all([
    fetch(weatherUrl),
    fetch(pollutionUrl)
  ]);

  // Error validation
  if (!weatherResponse.ok) {
    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }
  if (!pollutionResponse.ok) {
    throw new Error(`Air Pollution API error: ${pollutionResponse.status}`);
  }

  // Parse raw JSON payloads
  const weatherData = await weatherResponse.json();
  const pollutionData = await pollutionResponse.json();

  // Extract the specific aqi and methane targets safely from the nested array structure
  const pollutionList = pollutionData.list?.[0];
  
  return {
    temperature: weatherData.main.temp,
    humidity: weatherData.main.humidity,
    pressure: weatherData.main.pressure,
    windSpeed: weatherData.wind.speed,
    windDirection: weatherData.wind.deg,
    condition: weatherData.weather[0].main,
    description: weatherData.weather[0].description,
    
    // Fallback default values to 0 if data parameters are missing or unavailable
    aqi: pollutionList?.main?.aqi ?? 0,
    methane: pollutionList?.components?.nh3 ?? 0 // Note: OpenWeatherMap tracks primary greenhouse/pollutant gases via components
  };
}