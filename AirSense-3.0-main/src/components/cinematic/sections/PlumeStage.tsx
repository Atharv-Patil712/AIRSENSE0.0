import { StageSection } from '../StageSection';
import { Metric, MetricRow } from '../StagePrimitives';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface PlumeStageProps {
  data: CinematicData;
}

const TICKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/** UNDERSTAND — the transport vector, which is what turns a hotspot into an exposure. */
export function PlumeStage({ data }: PlumeStageProps) {
  const { plume } = data;
  const from = Math.round(plume.windFrom);
  const to = Math.round(plume.windTo);

  return (
    <StageSection
      id="plume"
      index={STAGE_INDEX.plume}
      kicker="03 · Understand — Pollution movement"
      heading="An atmosphere in motion."
      lede={`From ${plume.city}, the wind carries pollution ${plume.windToCardinal}. Follow the downwind vector, not just the source.`}
      children={
        <>
          <MetricRow>
            <Metric label="Wind from" value={`${from}°`} note={plume.windFromCardinal} />
            <Metric label="Plume travels toward" value={plume.windToCardinal} tone="accent" note={`${to}°`} />
            <Metric
              label="Wind speed"
              value={plume.windSpeed.toFixed(1)}
              unit="km/h"
              tone="blue"
              note={plume.dispersal}
            />
          </MetricRow>

          <p className="cin-editorial-note">
            Wind origin and downwind travel are opposite bearings. The arrow points in the direction of transport.
          </p>
        </>
      }
      aside={
        <>
          <svg viewBox="0 0 160 160" className="cin-compass" aria-hidden="true">
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--cin-border-strong)" strokeWidth="1" />
            <circle cx="80" cy="80" r="52" fill="none" stroke="var(--cin-border)" strokeWidth="1" strokeDasharray="3 5" />

            {TICKS.map((angle) => (
              <line
                key={angle}
                x1="80"
                y1="12"
                x2="80"
                y2={angle % 90 === 0 ? 4 : 7}
                stroke="var(--cin-border-strong)"
                strokeWidth="1"
                transform={`rotate(${angle} 80 80)`}
              />
            ))}

            <text x="80" y="26" className="cin-compass-label" textAnchor="middle">N</text>
            <text x="80" y="142" className="cin-compass-label" textAnchor="middle">S</text>
            <text x="140" y="84" className="cin-compass-label" textAnchor="middle">E</text>
            <text x="20" y="84" className="cin-compass-label" textAnchor="middle">W</text>

            {/* Where the wind comes from — a marker, not a direction of travel. */}
            <g transform={`rotate(${from} 80 80)`}>
              <line
                x1="80"
                y1="80"
                x2="80"
                y2="26"
                stroke="#38BDF8"
                strokeOpacity="0.35"
                strokeWidth="1.6"
                strokeDasharray="4 5"
              />
              <circle cx="80" cy="26" r="3.6" fill="#38BDF8" fillOpacity="0.5" />
            </g>

            {/* Downwind travel — the vector that matters. */}
            <g transform={`rotate(${to} 80 80)`}>
              <line x1="80" y1="80" x2="80" y2="30" stroke="#67E8F9" strokeWidth="2.6" />
              <polygon points="80,14 73.5,30 86.5,30" fill="#67E8F9" />
            </g>

            <circle cx="80" cy="80" r="4" fill="#F1F5F9" />
          </svg>

          <p className="cin-legend">
            <span className="cin-legend-item">
              <span className="cin-legend-swatch is-blue" /> Plume travel · {plume.windToCardinal}
            </span>
            <span className="cin-legend-item">
              <span className="cin-legend-swatch is-ice" /> Wind origin · {plume.windFromCardinal}
            </span>
          </p>

          <p className="cin-annotate-label cin-plume-source">
            Plume vector · {plume.city} · {plume.dispersal}
          </p>
        </>
      }
    />
  );
}