import type { PredictionResult, RiskLevel, Hotspot, AqiObservation, WeatherObservation } from '@/types';

interface PredictionInput {
  hotspot?: Hotspot;
  aqi?: AqiObservation | null;
  weather?: WeatherObservation | null;
  historicalTrend?: { value: number }[];
  location?: string;
}

class PredictionService {
  modelVersion = 'trend-projection-v1';

  predict(input: PredictionInput): PredictionResult {
    const { hotspot, aqi, weather, historicalTrend } = input;
    const factors: string[] = [];

    let trendScore = 0;

    if (historicalTrend && historicalTrend.length > 7) {
      const recent = historicalTrend.slice(-7).map((h) => h.value);
      const earlier = historicalTrend.slice(-14, -7).map((h) => h.value);
      if (recent.length && earlier.length) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
        const change = (recentAvg - earlierAvg) / earlierAvg;
        if (change > 0.1) {
          trendScore += 20;
          factors.push(`Recent methane readings increased by ${Math.round(change * 100)}% compared to the prior period`);
        } else if (change < -0.1) {
          trendScore -= 15;
          factors.push(`Recent methane readings decreased by ${Math.round(Math.abs(change) * 100)}%`);
        } else {
          factors.push('Methane readings have been relatively stable');
        }
      }
    }

    if (hotspot) {
      if (hotspot.risk_level === 'high' || hotspot.risk_level === 'critical') {
        trendScore += 15;
        factors.push(`Current hotspot risk level is ${hotspot.risk_level}`);
      }
    }

    if (weather) {
      if ((weather.temperature ?? 0) > 35) {
        trendScore += 10;
        factors.push('High temperature forecast may increase biological methane production');
      }
      if ((weather.wind_speed ?? 0) < 5) {
        trendScore += 10;
        factors.push('Low wind conditions may lead to methane accumulation');
      }
    }

    if (aqi && aqi.aqi > 200) {
      trendScore += 10;
      factors.push('Poor air quality may persist without significant atmospheric change');
    }

    const predictedRiskScore = Math.min(100, Math.max(10, 40 + trendScore));
    const predictedRisk: RiskLevel =
      predictedRiskScore >= 70 ? 'critical' : predictedRiskScore >= 50 ? 'high' : predictedRiskScore >= 25 ? 'moderate' : 'low';

    const trend: 'increasing' | 'decreasing' | 'stable' =
      trendScore > 10 ? 'increasing' : trendScore < -10 ? 'decreasing' : 'stable';

    const prediction =
      trend === 'increasing'
        ? 'Environmental risk is predicted to increase over the next monitoring period.'
        : trend === 'decreasing'
          ? 'Environmental risk is predicted to decrease over the next monitoring period.'
          : 'Environmental risk is predicted to remain stable over the next monitoring period.';

    return {
      predictedRisk,
      trend,
      confidence: Math.min(85, 50 + Math.abs(trendScore)),
      contributingFactors: factors.length > 0 ? factors : ['Insufficient historical data for detailed analysis'],
      prediction,
      modelConfidence: Math.min(75, 45 + Math.abs(trendScore)),
      horizon: '7 days',
    };
  }
}

export const predictionService = new PredictionService();
