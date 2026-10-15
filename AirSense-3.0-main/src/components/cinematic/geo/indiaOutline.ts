/* ──────────────────────────────────────────────────────────────
   Geographic helpers for the cinematic visualisation.

   Deliberately dependency-free (no GeoJSON, no d3-geo): the outline below
   is a coarse stylised boundary of India — enough to be immediately
   recognisable as the subcontinent, not a survey-grade representation.

   A single flat projection is exposed. The experience renders geography on
   an observation plane rather than on a sphere, so lat/lng maps straight
   onto the unit square shared by the WebGL plane and the SVG fallback
   markers (lng 68→97, lat 35→6 — the same frame the dashboard mini-map
   uses, so markers stay in the same place).
   ────────────────────────────────────────────────────────────── */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Coarse clockwise outline: Kashmir → Himalaya → North-east → east coast → tip → west coast. */
export const INDIA_OUTLINE: LatLng[] = [
  { lat: 34.6, lng: 74.3 },
  { lat: 33.2, lng: 76.4 },
  { lat: 33.0, lng: 78.6 },
  { lat: 31.0, lng: 79.1 },
  { lat: 30.4, lng: 81.0 },
  { lat: 29.0, lng: 83.4 },
  { lat: 27.6, lng: 86.5 },
  { lat: 27.2, lng: 88.6 },
  { lat: 27.9, lng: 91.6 },
  { lat: 28.4, lng: 95.4 },
  { lat: 27.0, lng: 97.1 },
  { lat: 25.4, lng: 95.4 },
  { lat: 24.0, lng: 94.2 },
  { lat: 22.2, lng: 93.4 },
  { lat: 21.9, lng: 92.2 },
  { lat: 24.0, lng: 89.6 },
  { lat: 25.2, lng: 89.8 },
  { lat: 23.0, lng: 88.7 },
  { lat: 21.6, lng: 87.5 },
  { lat: 19.9, lng: 86.1 },
  { lat: 17.7, lng: 83.3 },
  { lat: 15.9, lng: 81.2 },
  { lat: 13.5, lng: 80.3 },
  { lat: 11.5, lng: 79.8 },
  { lat: 9.2, lng: 79.1 },
  { lat: 8.1, lng: 77.5 },
  { lat: 8.9, lng: 76.6 },
  { lat: 11.0, lng: 75.8 },
  { lat: 13.0, lng: 74.7 },
  { lat: 15.5, lng: 73.8 },
  { lat: 18.0, lng: 72.8 },
  { lat: 20.5, lng: 72.7 },
  { lat: 22.3, lng: 72.2 },
  { lat: 21.5, lng: 71.0 },
  { lat: 22.5, lng: 69.1 },
  { lat: 23.7, lng: 68.7 },
  { lat: 24.6, lng: 70.5 },
  { lat: 26.0, lng: 70.2 },
  { lat: 28.0, lng: 70.5 },
  { lat: 29.6, lng: 72.4 },
  { lat: 30.1, lng: 74.0 },
  { lat: 32.0, lng: 74.3 },
  { lat: 33.1, lng: 74.2 },
];

/** Flat projection matching the dashboard mini-map: x left→right, y top→bottom, both 0..1. */
export function projectToUnit(lat: number, lng: number): { x: number; y: number } {
  return {
    x: (lng - 68) / (97 - 68),
    y: (35 - lat) / (35 - 6),
  };
}

/** SVG path for the stylised outline, projected onto a unit box (y already flipped). */
export function indiaOutlinePath(width = 100, height = 100): string {
  const points = INDIA_OUTLINE.map(({ lat, lng }) => {
    const { x, y } = projectToUnit(lat, lng);
    return `${(x * width).toFixed(2)} ${(y * height).toFixed(2)}`;
  });
  return `M${points.join(' L')} Z`;
}