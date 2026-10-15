/**
 * Shared chart language — one consistent scientific voice
 * across every Recharts surface in the product.
 */

export const CHART_COLORS = {
  primary: 'var(--color-primary-bg)',
  primarySoft: 'var(--color-primary-soft)',
  secondary: 'var(--color-prediction)',
  secondarySoft: 'color-mix(in srgb, var(--color-prediction) 12%, transparent)',
  good: 'var(--color-good)',
  yellow: 'var(--color-moderate)',
  orange: 'var(--color-warning)',
  red: 'var(--color-critical)',
  prediction: 'var(--color-prediction)',
};

export const chartTick = { fontSize: 10.5, fontFamily: 'var(--font-mono)', fill: 'var(--chart-tick)' } as const;

export const chartAxisLine = { stroke: 'var(--chart-axis)' } as const;

export const chartGridStroke = 'var(--chart-grid)';

export const tooltipContentStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'var(--font-body)',
  fontVariantNumeric: 'tabular-nums lining-nums',
  lineHeight: 1.5,
  color: 'var(--color-text)',
  boxShadow: '0 8px 24px -6px rgba(14, 17, 19, 0.16)',
  padding: '8px 11px',
} as const;

export const tooltipItemStyle = { color: 'var(--color-text)', padding: 0 } as const;

export const tooltipLabelStyle = {
  color: 'var(--color-text-muted)',
  fontSize: 11,
  fontWeight: 500,
  marginBottom: 2,
} as const;

export const tooltipCursor = { fill: 'rgba(127, 127, 127, 0.07)' } as const;