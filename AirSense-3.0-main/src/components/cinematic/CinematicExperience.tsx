import './artDirection.css';

import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AirSenseMark } from '@/components/brand/AirSenseMark';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { CinematicAtmosphere } from './CinematicAtmosphere';
import { ProvenanceNote } from './ProvenanceNote';
import { WorkflowRail } from './WorkflowRail';
import { useScrollStage } from './useScrollStage';
import { AqiStage } from './sections/AqiStage';
import { BriefStage } from './sections/BriefStage';
import { EnterStage } from './sections/EnterStage';
import { EnvironmentStage } from './sections/EnvironmentStage';
import { HeroStage } from './sections/HeroStage';
import { MethaneStage } from './sections/MethaneStage';
import { PlumeStage } from './sections/PlumeStage';
import { RiskStage } from './sections/RiskStage';
import { FALLBACK_CINEMATIC_DATA } from './model';
import { STAGES } from './types';
import type { CinematicData } from './types';

export interface CinematicExperienceProps {
  /** Complete storyboard contract. Defaults to the demo-backed contract. */
  data?: CinematicData;
  /** Primary call to action — the handoff into the product. */
  onEnter?: () => void;
  /** Label for the primary call to action. */
  enterLabel?: string;
  /** Force the reduced-motion composition; defaults to the OS preference. */
  reducedMotion?: boolean;
  className?: string;
}

/**
 * The cinematic AirSense experience.
 *
 * Fully prop-driven and self-contained: it renders from `data` alone, reads
 * nothing from services or storage, and can be mounted on any route. Layout is
 * scroll-linked rather than time-based, so it degrades to a complete static
 * story for reduced-motion users instead of losing its content.
 */
export function CinematicExperience({
  data = FALLBACK_CINEMATIC_DATA,
  onEnter,
  enterLabel = 'Enter AirSense',
  reducedMotion,
  className = '',
}: CinematicExperienceProps) {
  const prefersReduced = usePrefersReducedMotion();
  const reduce = reducedMotion ?? prefersReduced;
  const rootRef = useRef<HTMLDivElement>(null);

  const { stateRef, activeStage, refresh } = useScrollStage({ rootRef, enabled: !reduce });

  // Stage heights depend on the data (lists, brief length), so positions are
  // recalculated whenever the contract changes — including the swap from the
  // fallback set to live observations.
  useEffect(() => {
    refresh();
  }, [data, refresh]);

  const handleEnter = useCallback(() => {
    onEnter?.();
  }, [onEnter]);

  return (
    <div
      ref={rootRef}
      className={`cinematic relative isolate min-h-screen bg-[#05070D] text-[#F1F5F9] ${
        reduce ? 'reduce-motion' : ''
      } ${className}`}
    >
      <CinematicAtmosphere data={data} stateRef={stateRef} reducedMotion={reduce} />

      <header className="cin-nav fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="cin-nav-brand">
            <span className="cin-nav-mark">
              <AirSenseMark className="h-4 w-4" />
            </span>
            <span className="cin-nav-word">{data.brand.name}</span>
            <span className="cin-nav-region">India</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Link to="/overview" className="cin-nav-link">
              Overview
            </Link>
            <button type="button" onClick={handleEnter} className="cin-cta cin-cta-sm">
              {enterLabel}
            </button>
          </div>
        </div>
        <span className="cin-progress" aria-hidden="true" />
      </header>

      <WorkflowRail stages={STAGES} activeStage={activeStage} reducedMotion={reduce} />

      <main className="relative z-10">
        <HeroStage data={data} onEnter={handleEnter} enterLabel={enterLabel} />
        <EnvironmentStage data={data} />
        <AqiStage data={data} />
        <PlumeStage data={data} />
        <MethaneStage data={data} />
        <RiskStage data={data} />
        <BriefStage data={data} />
        <EnterStage
          data={data}
          onEnter={handleEnter}
          enterLabel={enterLabel}
          secondaryHref="/overview"
          secondaryLabel="Product overview"
        />
      </main>

      <ProvenanceNote data={data} />
    </div>
  );
}