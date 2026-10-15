import { indiaOutlinePath, projectToUnit } from './geo/indiaOutline';
import type { CinematicMethane } from './types';

/** Geographic concentration markers; halos are illustrative, not interpolated measurements. */
export function MethaneField({ methane }: { methane: CinematicMethane }) {
  return (
    <figure className="cin-methane-field">
      <svg viewBox="-25 -20 150 145" role="img" aria-label="Methane monitoring locations over India. Violet halos indicate relative concentration, not measured plume extent.">
        <g stroke="#67e8f9" strokeOpacity="0.12" strokeWidth="0.2">
          {[0, 25, 50, 75, 100].map((value) => (
            <path key={value} d={`M${value} -10V110 M-10 ${value}H110`} />
          ))}
        </g>
        <path d={indiaOutlinePath()} fill="#818cf8" fillOpacity="0.025" stroke="#94a3b8" strokeOpacity="0.5" strokeWidth="0.35" />
        {methane.sites.map((site) => {
          const { x, y } = projectToUnit(site.latitude, site.longitude);
          const radius = 3 + Math.min(1, Math.max(0, site.value / Math.max(1, methane.threshold) - 0.8)) * 16;
          return (
            <g key={site.id} transform={`translate(${x * 100} ${y * 100})`}>
              <title>{site.name}: {site.value} {methane.unit}</title>
              {[1.8, 1.3, 0.8].map((scale) => (
                <ellipse key={scale} rx={radius * scale} ry={radius * scale * 0.72} fill="#818cf8" fillOpacity="0.05" stroke="#c4b5fd" strokeOpacity="0.32" strokeWidth="0.25" />
              ))}
              <circle r="0.9" fill="#ddd6fe" />
            </g>
          );
        })}
      </svg>
      <figcaption>CH₄ / monitored concentrations</figcaption>
    </figure>
  );
}
