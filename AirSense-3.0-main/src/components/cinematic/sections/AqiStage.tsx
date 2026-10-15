import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { StageSection } from '../StageSection';
import { AQI_BANDS, AQI_SCALE_COLORS, aqiColor } from '../palette';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface AqiStageProps {
  data: CinematicData;
}

const AQI_CEILING = 500;

/** UNDERSTAND — the headline index set as an instrument, not a dashboard card. */
export function AqiStage({ data }: AqiStageProps) {
  const { aqi } = data;
  const delta = aqi.trendDelta;
  const TrendIcon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  const colour = aqiColor(aqi.value);

  const pollutants = [
    { label: 'PM2.5', value: aqi.pm25, dominant: aqi.dominantPollutant === 'pm2_5' },
    { label: 'PM10', value: aqi.pm10, dominant: aqi.dominantPollutant === 'pm10' },
    { label: 'NO₂', value: aqi.no2, dominant: aqi.dominantPollutant === 'no2' },
    { label: 'O₃', value: aqi.o3, dominant: aqi.dominantPollutant === 'o3' },
  ];

  return (
    <StageSection
      id="aqi"
      index={STAGE_INDEX.aqi}
      kicker="02 · Understand — Air quality"
      heading="Read the air."
      lede={`Pollutant concentrations in ${aqi.city}. AQI uses CPCB pollutant sub-indices.`}
      children={
        <>
          <div className="cin-readout">
            <span className="cin-readout-value" style={{ color: colour }}>
              {aqi.value}
            </span>
            <span className="cin-readout-category" style={{ color: colour }}>
              {aqi.category}
            </span>
            <span className={`cin-readout-trend ${delta !== null && delta > 0 ? 'is-worse' : 'is-better'}`}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {delta === null ? 'no trend' : `${delta > 0 ? '+' : ''}${delta}%`}
            </span>
            <span className="cin-readout-window">{aqi.window}</span>
          </div>

          <div className="cin-scale" role="img" aria-label={`AQI ${aqi.value} — ${aqi.category}`}>
            {AQI_BANDS.map((band, index) => {
              const width = ((band.range[1] - band.range[0] + 1) / AQI_CEILING) * 100;
              const active = band.label === aqi.category;
              return (
                <span
                  key={band.label}
                  className={`cin-scale-seg ${active ? 'is-active' : ''}`}
                  style={{ width: `${width}%`, backgroundColor: AQI_SCALE_COLORS[index] }}
                />
              );
            })}
            <span
              className="cin-scale-marker"
              style={{ left: `${Math.min(100, (aqi.value / AQI_CEILING) * 100)}%` }}
            />
          </div>
          <div className="cin-scale-labels">
            <span>0</span>
            <span>100 · Moderate</span>
            <span>200 · Poor</span>
            <span>300 · Very poor</span>
            <span>500 · Severe</span>
          </div>
        </>
      }
      aside={
        <>
          <dl className="cin-annotate">
            <div className="cin-annotate-row">
              <dt className="cin-annotate-label">Pollutant concentrations · {aqi.city}</dt>
              <dd className="cin-annotate-values">
                {pollutants.map((p) => (
                  <span key={p.label} className={`cin-annotate-value ${p.dominant ? 'is-dominant' : ''}`}>
                    <span className="cin-annotate-name">{p.label}</span>
                    <span className="cin-annotate-num">
                      {p.value ?? '—'}
                      {p.value !== null && <span className="cin-unit">µg/m³</span>}
                    </span>
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          {aqi.worst && (
            <p className="cin-fineprint cin-fineprint-muted">
              Highest this window — {aqi.worst.city}, {aqi.worst.value} ({aqi.worst.category}).
            </p>
          )}
        </>
      }
    />
  );
}