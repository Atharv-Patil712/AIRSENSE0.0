import { SEVERITY_COLORS, FALLBACK_SEVERITY_COLOR } from './palette';
import { indiaOutlinePath, projectToUnit } from './geo/indiaOutline';
import type { CinematicData } from './types';

interface AtmospherePosterProps {
  data: CinematicData;
  className?: string;
}

/** Contour lines, drawn as gentle curves rather than as a grid of cells. */
const CONTOURS = [12, 24, 36, 48, 60, 72, 84];

/**
 * Static composition of the same visual language as the WebGL layer.
 *
 * Used as the base layer while Three.js is still loading, and as the only layer
 * for reduced-motion users and devices without WebGL — so the page never shows a
 * blank frame and never pays for a renderer it cannot run.
 *
 * It is deliberately not a globe: an atmospheric gradient, a survey grid, a
 * hairline boundary and the observation marks. Geometry, not a planet.
 */
export function AtmospherePoster({ data, className = '' }: AtmospherePosterProps) {
  const outline = indiaOutlinePath(100, 100);
  const sites = data.methane.sites.slice(0, 18);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#05070D] ${className}`}>
      {/* Atmospheric strata — offset and elongated, so nothing reads as a body. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 64% 44% at 70% 36%, rgba(56,189,248,0.15) 0%, rgba(30,58,138,0.11) 46%, rgba(5,7,13,0) 78%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 32% at 24% 64%, rgba(37,99,235,0.12) 0%, rgba(5,7,13,0) 74%)',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute left-1/2 top-1/2 h-[135vh] w-[135vh] max-w-none -translate-x-1/2 -translate-y-1/2 lg:left-[66%]"
        aria-hidden="true"
      >
        {/* Environmental contours: the measured-surface register. */}
        <g stroke="#1E3A5F" strokeOpacity="0.6" fill="none" strokeWidth="0.12">
          {CONTOURS.map((y) => (
            <path key={y} d={`M4 ${y} C 26 ${y - 3.5}, 52 ${y + 3.5}, 96 ${y - 1.5}`} />
          ))}
        </g>

        {/* Survey ticks — structure at the instrument scale. */}
        <g stroke="#2E5378" strokeOpacity="0.4" strokeWidth="0.1">
          {CONTOURS.map((y) => (
            <line key={y} x1="30" y1={y} x2="30" y2={y + 0.8} />
          ))}
        </g>

        {/* Geography: a hairline that is still forming, not a border. */}
        <path
          d={outline}
          fill="none"
          stroke="#7DD3FC"
          strokeOpacity="0.32"
          strokeWidth="0.22"
          strokeDasharray="2.2 2.8"
          strokeLinejoin="round"
        />

        {/* Observations. Cyan is a plain reading; the ramp means it matters. */}
        {sites.map((site) => {
          const { x, y } = projectToUnit(site.latitude, site.longitude);
          const severity = Math.min(1, Math.max(0, (site.value - 1800) / 700));
          const tone =
            site.level === 'low'
              ? '#67E8F9'
              : SEVERITY_COLORS[site.level] ?? FALLBACK_SEVERITY_COLOR;

          return (
            <g key={site.id}>
              {severity > 0.45 && (
                <circle cx={x * 100} cy={y * 100} r={1.6 + severity * 1.5} fill={tone} fillOpacity="0.07" />
              )}
              <circle cx={x * 100} cy={y * 100} r={0.42 + severity * 0.34} fill={tone} fillOpacity="0.85" />
            </g>
          );
        })}
      </svg>

      {/* Horizon: depth for the closing frames without adding an object. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh]"
        style={{
          background:
            'linear-gradient(to top, rgba(21,94,117,0.24) 0%, rgba(30,58,138,0.10) 46%, rgba(5,7,13,0) 100%)',
        }}
      />

      <div className="cin-vignette absolute inset-0" />
    </div>
  );
}
