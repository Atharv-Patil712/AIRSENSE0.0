import type { ReactNode } from 'react';

type StageHeight = 'hero' | 'tall' | 'brief' | 'final';

interface StageSectionProps {
  /** Matches the storyboard id, so the rail can jump to `#stage-<id>`. */
  id: string;
  /** Storyboard index — also the canvas stage key. */
  index: number;
  kicker: string;
  heading: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
  height?: StageHeight;
  /** Centre the copy over the field (used by the hero and the final call to action). */
  centred?: boolean;
  /** The hero owns the page's single h1. */
  headingAs?: 'h1' | 'h2';
  /** Stage accent: shifts the kicker/note hue as the story evolves. */
  tone?: 'default' | 'methane' | 'risk' | 'brief';
}

const HEIGHTS: Record<StageHeight, string> = {
  hero: 'cin-stage-hero',
  tall: 'cin-stage-tall',
  brief: 'cin-stage-brief',
  final: 'cin-stage-final',
};

/**
 * One pinned stage of the narrative.
 *
 * Pinning is done with CSS `position: sticky` rather than ScrollTrigger's pin
 * wrapper: the section stays tall, the panel sticks for the remainder, and
 * GSAP only ever writes to the canvas and to reveal classes — so React can
 * re-render freely without fighting a pin-spacer.
 */
export function StageSection({
  id,
  index,
  kicker,
  heading,
  lede,
  children,
  aside,
  actions,
  height = 'tall',
  centred = false,
  headingAs = 'h2',
  tone = 'default',
}: StageSectionProps) {
  return (
    <section
      id={`stage-${id}`}
      data-stage={index}
      className={`cin-stage ${HEIGHTS[height]} ${tone !== 'default' ? `cin-tone-${tone}` : ''}`}
    >
      {/* Readability scrim where the field sits behind the copy on small screens. */}
      <div className="cin-scrim pointer-events-none absolute inset-0 lg:hidden" />

      <div className="cin-stage-panel relative z-10 flex items-center">
        <div className="cin-stage-shell">
          <div className="cin-stage-grid">
            <div className={centred ? 'lg:col-span-12 lg:mx-auto lg:max-w-3xl lg:text-center' : 'lg:col-span-6'}>
              <p className="cin-kicker" data-reveal>
                {kicker}
              </p>
              {headingAs === 'h1' ? (
                <h1 className="cin-heading" data-reveal>
                  {heading}
                </h1>
              ) : (
                <h2 className="cin-heading" data-reveal>
                  {heading}
                </h2>
              )}
              {lede && (
                <p className={`cin-lede ${centred ? 'lg:mx-auto' : ''}`} data-reveal>
                  {lede}
                </p>
              )}
              {children && (
                <div className="mt-8" data-reveal>
                  {children}
                </div>
              )}
              {actions && (
                <div className={`mt-8 flex flex-wrap gap-3 ${centred ? 'lg:justify-center' : ''}`} data-reveal>
                  {actions}
                </div>
              )}
            </div>

            {aside && (
              <div className="lg:col-span-6" data-reveal>
                {aside}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}