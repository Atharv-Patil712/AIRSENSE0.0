import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createAtmosphereState } from './types';
import type { AtmosphereState } from './types';

gsap.registerPlugin(ScrollTrigger);

interface UseScrollStageOptions {
  rootRef: RefObject<HTMLElement>;
  /** False for reduced-motion users: stage tracking without any scroll-linked motion. */
  enabled: boolean;
}

export interface ScrollStageApi {
  /** Read by the WebGL loop every frame — deliberately not React state. */
  stateRef: MutableRefObject<AtmosphereState>;
  /** Index of the stage currently under the viewport centre, for the workflow rail. */
  activeStage: number;
  /** Recalculates trigger positions after content (or data) changes size. */
  refresh: () => void;
}

/**
 * Scroll choreography for the experience.
 *
 * Two deliberate choices keep this cheap and StrictMode-safe:
 *
 * 1. Scroll position is written into a ref, never React state, so scrolling
 *    never re-renders the tree. React state is only touched when the integer
 *    stage changes (the workflow rail).
 * 2. Reveals toggle a CSS class from `onEnter` instead of running a GSAP
 *    `from()` tween, so a StrictMode double-mount cannot leave elements
 *    stranded at opacity 0.
 */
export function useScrollStage({ rootRef, enabled }: UseScrollStageOptions): ScrollStageApi {
  const stateRef = useRef<AtmosphereState>(createAtmosphereState());
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]'));
    if (sections.length === 0) return;

    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

    /* ── Reduced motion: state only, no animation, no GSAP ── */
    if (!enabled) {
      reveals.forEach((element) => element.classList.add('is-revealed'));

      let frame = 0;
      const measure = () => {
        frame = 0;
        const viewportCentre = window.scrollY + window.innerHeight / 2;
        let index = 0;
        sections.forEach((section, i) => {
          const top = section.getBoundingClientRect().top + window.scrollY;
          if (top <= viewportCentre) index = i;
        });
        if (index !== stateRef.current.stage) {
          stateRef.current.stage = index;
          setActiveStage(index);
        }
        stateRef.current.stageMix = 0;

        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const overall = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
        stateRef.current.overall = overall;
        root.style.setProperty('--cin-progress', overall.toFixed(4));
      };

      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(measure);
      };

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      measure();

      return () => {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        if (frame) cancelAnimationFrame(frame);
      };
    }

    /* ── Full choreography ── */
    const triggers: ScrollTrigger[] = [];

    sections.forEach((section, index) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onUpdate: (self) => {
            stateRef.current.stage = index;
            stateRef.current.stageMix = self.progress;
          },
          onToggle: (self) => {
            if (self.isActive) {
              stateRef.current.stage = index;
              setActiveStage(index);
            }
          },
        }),
      );
    });

    // One trigger owns the global progress readout (used by the rail and nav).
    triggers.push(
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          stateRef.current.overall = self.progress;
          root.style.setProperty('--cin-progress', self.progress.toFixed(4));
        },
      }),
    );

    reveals.forEach((element, index) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: element,
          start: 'top 88%',
          once: true,
          onEnter: () => element.classList.add('is-revealed'),
          // Safety net: if the element was already scrolled past when the
          // trigger was created, reveal it on the next refresh instead.
          onRefresh: (self) => {
            if (self.progress === 1) element.classList.add('is-revealed');
          },
          id: `cin-reveal-${index}`,
        }),
      );
    });

    // Only now is the copy allowed to start hidden. If anything above threw,
    // the page renders fully visible rather than blank.
    root.classList.add('cin-animated');
    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      triggers.length = 0;
      root.classList.remove('cin-animated');
      reveals.forEach((element) => element.classList.remove('is-revealed'));
    };
  }, [rootRef, enabled]);

  const refresh = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  return { stateRef, activeStage, refresh };
}