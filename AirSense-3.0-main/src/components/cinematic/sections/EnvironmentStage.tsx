import { StageSection } from '../StageSection';
import { Card, Metric, MetricRow } from '../StagePrimitives';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface EnvironmentStageProps {
  data: CinematicData;
}

/** OBSERVE — what the network is picking up right now. */
export function EnvironmentStage({ data }: EnvironmentStageProps) {
  const { environment } = data;

  return (
    <StageSection
      id="environment"
      index={STAGE_INDEX.environment}
      kicker="01 · Observe — Live environment"
      heading="A living observation network."
      lede="Station readings, satellite passes and public APIs come together in one environmental view, with source details alongside each observation window."
      children={
        <>
          <MetricRow>
            <Metric
              label="Monitoring stations"
              value={environment.stationCount}
              tone="accent"
              note="Reporting in the current window"
            />
            <Metric label="Cities covered" value={environment.cityCount} note="Across the network" />
            <Metric
              label="Tracked sites"
              value={environment.hotspotCount}
              tone="blue"
              note="Hotspots under observation"
            />
          </MetricRow>

          <p className="cin-stamp">
            Source: {data.isDemo ? 'AirSense reference dataset' : 'Connected observations'}
          </p>
        </>
      }
      aside={
        <Card title="Where the data comes from" meta="Provenance">
          <ul className="cin-provenance">
            {environment.sources.map((source) => (
              <li key={source.label} className="cin-provenance-row">
                <span className="cin-provenance-label">{source.label}</span>
                <span className="cin-provenance-detail">{source.detail}</span>
              </li>
            ))}
          </ul>
        </Card>
      }
    />
  );
}