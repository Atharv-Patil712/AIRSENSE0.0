import { StageSection } from '../StageSection';
import { Metric, MetricRow, NoteBox } from '../StagePrimitives';
import { SEVERITY_COLORS, FALLBACK_SEVERITY_COLOR } from '../palette';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface RiskStageProps {
  data: CinematicData;
}


/** PREDICT — one composite index, with the factors that produced it exposed. */
export function RiskStage({ data }: RiskStageProps) {
  const { risk } = data;
  const tone = 'risk';
  const colour = SEVERITY_COLORS[risk.level] ?? FALLBACK_SEVERITY_COLOR;
  const intensity = Math.max(0, Math.min(100, risk.index)) / 100;

  return (
    <StageSection
      id="risk"
      index={STAGE_INDEX.risk}
      tone={tone}
      kicker="05 · Predict — Environmental risk"
      heading="Where signals converge."
      lede="Methane, air quality and wind dispersion resolve into one comparative risk index. The contributing factors remain visible."
      children={
        <>
          <MetricRow>
            <Metric
              label="Risk level"
              value={<span style={{ color: colour }}>{risk.level}</span>}
              note="Derived from the index"
            />
            <Metric
              label="Detection confidence"
              value={risk.confidence}
              unit="%"
              tone="accent"
              note="Signal quality"
            />
            <Metric label="Model" value="v1" note="Rule-based, auditable" />
          </MetricRow>

          <ol className="cin-factors">
            {risk.factors.map((factor, index) => (
              <li key={factor} className="cin-factor">
                <span className="cin-factor-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="cin-factor-text">{factor}</span>
              </li>
            ))}
          </ol>

          <NoteBox title="Composite, not absolute">
            The index is comparative — it ranks conditions across the monitored network. It is not a
            regulatory determination and should not be used as one.
          </NoteBox>
        </>
      }
      aside={
        <figure className="cin-risk-field" style={{ color: colour }}>
          <svg viewBox="0 0 600 600" role="img" aria-label={`Comparative risk field: ${risk.index} of 100, ${risk.level}. Illustrative contours, not geographic exposure boundaries.`}>
            <g fill="none" stroke="currentColor">
              {[0.55, 0.75, 1, 1.25, 1.5, 1.8].map((scale, index) => (
                <path
                  key={scale}
                  d="M 0,-125 C 82,-150 153,-60 136,17 C 122,93 43,152 -35,132 C -121,115 -151,42 -125,-43 C -106,-101 -59,-115 0,-125 Z"
                  transform={`translate(310 295) rotate(${index * 13}) scale(${scale * (0.8 + intensity * 0.3)})`}
                  strokeWidth={1 / scale}
                  strokeOpacity={0.55 - index * 0.065}
                  fill="currentColor"
                  fillOpacity="0.018"
                />
              ))}
            </g>
            <g stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1">
              <path d="M30 295H135 M480 295H570 M310 25V100 M310 490V575" />
              <path d="M30 285V305 M570 285V305 M300 25H320 M300 575H320" />
            </g>
          </svg>
          <div className="cin-risk-score">
            <span className="cin-annotate-label">Environmental risk index</span>
            <span className="cin-risk-number">{risk.index}<small>/100</small></span>
            <span className="cin-risk-level">{risk.level}</span>
          </div>
          <figcaption className="cin-fineprint cin-fineprint-muted">
            {risk.factors.length} contributing {risk.factors.length === 1 ? 'factor' : 'factors'} · comparative intensity
          </figcaption>
        </figure>
      }
    />
  );
}