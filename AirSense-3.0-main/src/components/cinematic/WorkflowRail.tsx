import { WORKFLOW } from './types';
import type { StageMeta, WorkflowPhase } from './types';

interface WorkflowRailProps {
  stages: StageMeta[];
  activeStage: number;
  reducedMotion: boolean;
}

/** The first stage index that belongs to each workflow phase. */
function firstStageOf(stages: StageMeta[], phase: WorkflowPhase): number {
  return Math.max(
    0,
    stages.findIndex((stage) => stage.phase === phase),
  );
}

/**
 * Desktop-only progress rail: keeps the observer oriented in the
 * OBSERVE → UNDERSTAND → PREDICT → ACT sequence while scrolling.
 */
export function WorkflowRail({ stages, activeStage, reducedMotion }: WorkflowRailProps) {
  const activePhase = stages[activeStage]?.phase ?? 'observe';

  const jumpTo = (index: number) => {
    const target = document.getElementById(`stage-${stages[index]?.id ?? 'hero'}`);
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav className="cin-rail" aria-label="Narrative progress">
      <ol className="cin-rail-list">
        {WORKFLOW.map((phase, phaseIndex) => {
          const index = firstStageOf(stages, phase.id);
          const isActive = phase.id === activePhase;
          const isPast = index < activeStage;
          return (
            <li key={phase.id} className="cin-rail-item">
              <button
                type="button"
                onClick={() => jumpTo(index)}
                className={`cin-rail-button ${isActive ? 'is-active' : ''} ${isPast ? 'is-past' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="cin-rail-number">{String(phaseIndex + 1).padStart(2, '0')}</span>

                <span className="cin-rail-tick" aria-hidden="true" />
                <span className="cin-rail-label">{phase.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <span className="cin-rail-progress" aria-hidden="true" />
    </nav>
  );
}