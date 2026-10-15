import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StageSection } from '../StageSection';
import { STAGE_INDEX } from '../types';
import type { CinematicData } from '../types';

interface HeroStageProps {
  data: CinematicData;
  onEnter: () => void;
  enterLabel: string;
}

/**
 * Opening frame — a film title card, not a landing hero.
 *
 * Copy sits left on the editorial grid; the flow field occupies the right
 * (the atmosphere layer already leans the field right on desktop). No
 * card stack, no workflow pill bar — the fixed rail carries the phases.
 */
export function HeroStage({ data, onEnter, enterLabel }: HeroStageProps) {
  return (
    <StageSection
      id="hero"
      index={STAGE_INDEX.hero}
      headingAs="h1"
      height="hero"
      kicker={`Environmental intelligence · India`}
      heading={<span className="cin-wordmark">{data.brand.name}</span>}
      lede={<span className="cin-tagline">{data.brand.tagline}</span>}
      actions={
        <>
          <button type="button" onClick={onEnter} className="cin-cta">
            {enterLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link to="/overview" className="cin-cta-ghost">
            Product overview
          </Link>
        </>
      }
    >
      <p className="cin-cue">
        <span className="cin-cue-dot" aria-hidden="true" />
        Scroll to follow the sequence
      </p>
    </StageSection>
  );
}