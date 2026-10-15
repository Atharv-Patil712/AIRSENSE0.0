/**
 * Small statistical helpers used by correlation & comparison surfaces.
 * Deliberately dependency-free and transparent.
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Pearson correlation coefficient.
 * Returns 0 when undefined (< 3 pairs or zero variance).
 */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Plain-language reading of a correlation coefficient. */
export function describeCorrelation(r: number): string {
  const abs = Math.abs(r);
  const strength = abs >= 0.6 ? 'Strong' : abs >= 0.35 ? 'Moderate' : abs >= 0.15 ? 'Weak' : 'Negligible';
  const direction = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'no clear';
  return `${strength} ${direction}`;
}
