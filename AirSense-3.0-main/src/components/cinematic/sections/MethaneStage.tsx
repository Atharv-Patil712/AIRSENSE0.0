import { clamp } from '@/lib/format';
import { MethaneField } from '../MethaneField';
import { StageSection } from '../StageSection';
import { Metric, MetricRow } from '../StagePrimitives';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface MethaneStageProps {
  data: CinematicData;
}

/** Concentration range the bar below spans, in ppb. */
const BAR_MIN = 1800;
const BAR_MAX = 2600;

/** UNDERSTAND — the greenhouse-gas signal, kept visibly separate from the AQI story. */
export function MethaneStage({ data }: MethaneStageProps) {
  const { methane } = data;
  const peakPercent = clamp(((methane.peak - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100, 0, 100);
  const thresholdPercent = clamp(((methane.threshold - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100, 0, 100);

  return (
    <StageSection
      id="methane"
      index={STAGE_INDEX.methane}
      tone="methane"
      kicker="04 · Understand — Methane"
      heading="The invisible signal."
      lede="Methane has its own atmospheric signature. Track concentration, source and threshold independently of the air-quality index."
      children={
        <>
          <MetricRow>
            <Metric
              label="Peak concentration"
              value={methane.peak}
              unit={methane.unit}
              tone="violet"
              note={methane.peakSite ?? 'No site reported'}
            />
            <Metric
              label="Network mean"
              value={methane.mean}
              unit={methane.unit}
              note={`Across ${data.environment.hotspotCount} tracked sites`}
            />
            <Metric
              label="Attention threshold"
              value={methane.threshold}
              unit={methane.unit}
              tone="default"
              note="Model attention boundary"
            />
          </MetricRow>

          <div className="cin-bar" role="img" aria-label={`Peak ${methane.peak} ${methane.unit}, threshold ${methane.threshold} ${methane.unit}`}>
            <span className="cin-bar-fill" style={{ width: `${peakPercent}%` }} />
            <span className="cin-bar-threshold" style={{ left: `${thresholdPercent}%` }}>
              <span className="cin-bar-threshold-label">threshold</span>
            </span>
          </div>

          <p className="cin-editorial-note">
            Methane is monitored on its own concentration scale, independently of AQI.
          </p>
        </>
      }
      aside={
        <div className="cin-site-register">
          <MethaneField methane={methane} />
          <p className="cin-annotate-label">Active methane sites · concentration</p>
          <dl className="cin-site-readings">
            {methane.sites.slice(0, 6).map((site) => (
              <div key={site.id} className="cin-site-reading">
                <dt>{site.name}<span className="cin-coordinate">{site.latitude.toFixed(2)}° N / {site.longitude.toFixed(2)}° E</span></dt>
                <dd>{site.value}<span className="cin-unit">{methane.unit}</span></dd>
              </div>
            ))}
          </dl>
          {methane.sites.length === 0 && <p className="cin-fineprint">No sites reported in this window.</p>}
          <p className="cin-editorial-note">
            {methane.sites[0]?.source
              ? `Probable source at ${methane.sites[0].name}: ${methane.sites[0].source.replace('_', ' ')}.`
              : 'No source attribution available for the current window.'}
          </p>
          <p className="cin-fineprint">{data.risk.method} · Model <span className="font-mono">{data.brief.modelVersion}</span></p>
        </div>
      }
    />
  );
}