import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import gsap from 'gsap';
import type { AtmosphereState, CinematicData } from './types';
import { AtmospherePoster } from './AtmospherePoster';

interface CinematicAtmosphereProps {
  data: CinematicData;
  stateRef: MutableRefObject<AtmosphereState>;
  reducedMotion: boolean;
}

/** The slice of AtmosphereScene this component drives — imported lazily. */
interface SceneHandle {
  resize: (width: number, height: number, dpr: number) => void;
  render: (state: AtmosphereState, dt: number) => void;
  setSplit: (split: boolean) => void;
  setData: (data: CinematicData) => void;
  dispose: () => void;
}

/** Cheap capability probe, so we never build a renderer that cannot run. */
function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Scale the particle field to the device instead of shipping one size for all. */
function particleBudget(): number {
  if (window.innerWidth < 1024) return 1400;
  const cores = navigator.hardwareConcurrency ?? 4;
  return cores >= 8 ? 3200 : 2200;
}

/**
 * The single WebGL surface behind the experience.
 *
 * Three.js is imported dynamically so the heavy dependency lands in its own
 * chunk, is never loaded by the dashboard routes, and arrives *after* the
 * typography has already painted. One gsap ticker drives the render loop, and
 * that loop stops entirely when the canvas is off-screen or the tab is hidden.
 */
export function CinematicAtmosphere({ data, stateRef, reducedMotion }: CinematicAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const dataRef = useRef(data);
  const [active, setActive] = useState(false);

  // Hand fresh props to the live scene without rebuilding it.
  useEffect(() => {
    dataRef.current = data;
    sceneRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas || !supportsWebGL()) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const onCleanup = (fn: () => void) => {
      if (disposed) fn();
      else cleanups.push(fn);
    };

    const wideQuery = window.matchMedia('(min-width: 1024px)');
    let visible = document.visibilityState === 'visible';

    void (async () => {
      try {
        const { AtmosphereScene } = await import('./layers/atmosphereScene');
        if (disposed) return;

        const scene = new AtmosphereScene(canvas, dataRef.current, {
          split: wideQuery.matches,
          particleCount: particleBudget(),
        });
        sceneRef.current = scene;

        const resize = () =>
          scene.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio || 1);
        resize();
        setActive(true);

        const handleWideChange = () => scene.setSplit(wideQuery.matches);
        const handleVisibility = () => {
          visible = document.visibilityState === 'visible';
        };

        const observer = new IntersectionObserver(
          (entries) => {
            visible = document.visibilityState === 'visible' && entries[0]?.isIntersecting === true;
          },
          { threshold: 0 },
        );
        observer.observe(canvas);

        window.addEventListener('resize', resize);
        wideQuery.addEventListener('change', handleWideChange);
        document.addEventListener('visibilitychange', handleVisibility);

        const onTick = (_time: number, delta: number) => {
          if (!visible) return;
          scene.render(stateRef.current, Math.min(delta, 60) / 1000);
        };
        gsap.ticker.add(onTick);

        onCleanup(() => {
          gsap.ticker.remove(onTick);
          observer.disconnect();
          window.removeEventListener('resize', resize);
          wideQuery.removeEventListener('change', handleWideChange);
          document.removeEventListener('visibilitychange', handleVisibility);
          scene.dispose();
          sceneRef.current = null;
        });
      } catch (error) {
        console.warn(
          'AirSense: atmospheric layer unavailable — showing the static composition instead.',
          error,
        );
      }
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    };
  }, [reducedMotion, stateRef]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <AtmospherePoster
        data={data}
        className={active ? 'opacity-0 transition-opacity duration-1000' : 'opacity-100'}
      />
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
            active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}