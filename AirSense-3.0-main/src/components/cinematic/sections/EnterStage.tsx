import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StageSection } from '../StageSection';
import { STAGE_INDEX, WORKFLOW } from '../types';
import type { CinematicData } from '../types';

interface EnterStageProps {
  data: CinematicData;
  onEnter: () => void;
  enterLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

/** ACT — the handoff into the operational product. */
export function EnterStage({
  data,
  onEnter,
  enterLabel,
  secondaryHref,
  secondaryLabel,
}: EnterStageProps) {
  return (
    <StageSection
      id="enter"
      index={STAGE_INDEX.enter}
      headingAs="h2"
      height="final"
      centred
      kicker="07 · Enter AirSense"
      heading="Everything above is already in the product."
      lede={`This page is the narrative. The dashboard is the instrument — the same observations, with filters, maps, source analysis and alerting you can work in. ${data.brand.tagline}`}
      actions={
        <>
          <button type="button" onClick={onEnter} className="cin-cta">
            {enterLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link to={secondaryHref} className="cin-cta-ghost">
            {secondaryLabel}
          </Link>
        </>
      }
    >
      <ul className="cin-recap">
        {WORKFLOW.map((phase, index) => (
          <li key={phase.id} className="cin-recap-step">
            <span className="cin-recap-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="cin-recap-label">{phase.label}</span>
            <span className="cin-recap-detail">{phase.detail}</span>
          </li>
        ))}
      </ul>
    </StageSection>
  );
}