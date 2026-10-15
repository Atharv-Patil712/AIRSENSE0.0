import { StageSection } from '../StageSection';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface BriefStageProps {
  data: CinematicData;
}

/** ACT — the analyst's brief: what changed, why it matters, what comes next. */
export function BriefStage({ data }: BriefStageProps) {
  const items = [
    { label: 'What changed', body: data.brief.whatChanged },
    { label: 'What is driving it', body: data.brief.whyItMatters },
    { label: 'What happens next', body: data.brief.whatNext },
    { label: 'Recommended action', body: 'Review the contributing factors and downwind locations in the dashboard. Prioritize follow-up using the current severity, confidence and observation window.' },
  ];

  return (
    <StageSection
      id="brief"
      index={STAGE_INDEX.brief}
      height="brief"
      tone="brief"
      kicker="06 · Act — AI environmental brief"
      heading="From observation to action."
      lede="The intelligence brief. Signals, drivers and the next decision."
      children={
        <ol className="cin-brief">
          {items.map((item) => (
            <li key={item.label} className="cin-brief-item">
              <p className="cin-brief-label">{item.label}</p>
              <p className="cin-brief-body">{item.body}</p>
            </li>
          ))}
        </ol>
      }
      aside={
        <>
          <div className="cin-brief-context">
            <p className="cin-annotate-label">Observation record / AirSense</p>
            <dl className="cin-provenance">
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Source</dt>
                <dd className="cin-provenance-detail">
                  {data.isDemo ? 'AirSense reference dataset' : 'Connected observations / AirSense'}
                </dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Updated</dt>
                <dd className="cin-provenance-detail font-mono">
                  {new Date(data.environment.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                </dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Confidence</dt>
                <dd className="cin-provenance-detail font-mono">{data.risk.confidence}%</dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Models</dt>
                <dd className="cin-provenance-detail font-mono">{data.brief.modelVersion}</dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Index</dt>
                <dd className="cin-provenance-detail">
                  <span className="font-mono">{data.risk.index}/100</span> · {data.risk.level}
                </dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Peak methane</dt>
                <dd className="cin-provenance-detail">
                  <span className="font-mono">{data.methane.peak} {data.methane.unit}</span>
                </dd>
              </div>
              <div className="cin-provenance-row">
                <dt className="cin-provenance-label">Air quality</dt>
                <dd className="cin-provenance-detail">
                  AQI <span className="font-mono">{data.aqi.value}</span> · {data.aqi.category}
                </dd>
              </div>
            </dl>
          </div>
        </>
      }
    />
  );
}