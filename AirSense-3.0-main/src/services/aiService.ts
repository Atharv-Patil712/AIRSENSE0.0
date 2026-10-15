import type {
  Hotspot,
  AqiObservation,
  WeatherObservation,
  SourcePrediction,
  AIAnalysisResult,
  SourceType,
  RiskLevel,
} from '@/types';
import { generateDemoSourcePredictions, SOURCE_CONTEXTS } from '@/data/demoData';
import { getAqiCategory } from '@/data/indiaData';

interface AIAnalysisInput {
  hotspot: Hotspot;
  aqi: AqiObservation | null;
  weather: WeatherObservation | null;
  historicalTrend?: { value: number }[];
}

class AIService {
  modelVersion = 'rule-based-v1';

  analyze(input: AIAnalysisInput): AIAnalysisResult {
    const { hotspot, aqi, weather, historicalTrend } = input;

    let riskScore = 0;
    const factors: string[] = [];
    const insights: string[] = [];

    const methaneLevel = hotspot.methane_index;
    if (methaneLevel > 2400) {
      riskScore += 40;
      factors.push('Elevated methane concentration above 2400 ppb threshold');
    } else if (methaneLevel > 2100) {
      riskScore += 25;
      factors.push('Methane concentration above 2100 ppb');
    } else if (methaneLevel > 1900) {
      riskScore += 10;
      factors.push('Moderately elevated methane concentration');
    }

    if (hotspot.confidence_score > 80) {
      riskScore += 15;
      factors.push(`High detection confidence (${hotspot.confidence_score}%)`);
    } else if (hotspot.confidence_score > 60) {
      riskScore += 8;
      factors.push(`Moderate detection confidence (${hotspot.confidence_score}%)`);
    }

    if (aqi) {
      const cat = getAqiCategory(aqi.aqi);
      if (aqi.aqi > 200) {
        riskScore += 20;
        factors.push(`Poor air quality (AQI ${aqi.aqi}, ${cat.label})`);
        insights.push(`Air quality in the area is ${cat.label.toLowerCase()} (AQI ${aqi.aqi}), which compounds environmental stress.`);
      } else if (aqi.aqi > 100) {
        riskScore += 10;
        factors.push(`Moderate air quality (AQI ${aqi.aqi})`);
      }
    }

    if (weather) {
      const windSpeed = weather.wind_speed ?? 0;
      if (windSpeed > 15) {
        factors.push(`Strong wind conditions (${windSpeed} km/h) may disperse methane plume`);
        insights.push(`Wind conditions at ${windSpeed} km/h from ${weather.wind_direction ?? 0}° indicate potential plume movement toward nearby areas.`);
      } else if (windSpeed < 5) {
        riskScore += 10;
        factors.push('Low wind speed may cause methane accumulation');
        insights.push('Low wind conditions may allow methane to accumulate locally rather than dispersing.');
      }
      if ((weather.temperature ?? 0) > 35) {
        riskScore += 5;
        factors.push('High temperature may accelerate biological methane production');
      }
    }

    if (historicalTrend && historicalTrend.length > 7) {
      const recent = historicalTrend.slice(-7).map((h) => h.value);
      const earlier = historicalTrend.slice(-14, -7).map((h) => h.value);
      if (recent.length && earlier.length) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
        if (recentAvg > earlierAvg * 1.1) {
          riskScore += 15;
          factors.push('Upward trend in recent methane readings');
          insights.push('Historical data shows an upward trend in methane levels over recent observations.');
        }
      }
    }

    riskScore = Math.min(100, riskScore);
    const riskLevel: RiskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'moderate' : 'low';

    const predictions = generateDemoSourcePredictions(hotspot);
    const probableSources = predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 4)
      .map((p) => ({ source: p.source_type as SourceType, probability: p.probability }));

    const topSource = probableSources[0];
    if (topSource) {
      const context = SOURCE_CONTEXTS[topSource.source];
      const contextStr = Array.isArray(context) ? context[0] : context;
      insights.unshift(`The detected pattern is most consistent with a ${topSource.source.replace('_', ' ')} source (${contextStr}).`);
    }

    insights.push(`An elevated methane hotspot has been detected in ${hotspot.name}. Environmental conditions should be monitored for potential impact on nearby populated areas.`);

    const confidence = hotspot.confidence_score;

    return {
      riskScore,
      riskLevel,
      probableSources,
      confidence,
      insights,
      contributingFactors: factors,
      modelVersion: this.modelVersion,
      disclaimer: 'AI-generated source classification is an estimate and should be independently verified. This is a prototype rule-based model, not a trained ML prediction.',
    };
  }

  getSourcePredictions(hotspot: Hotspot): SourcePrediction[] {
    return generateDemoSourcePredictions(hotspot);
  }
}

export const aiService = new AIService();
