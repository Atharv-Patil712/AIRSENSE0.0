interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

/** Minimal inline sparkline — pure SVG, no chart library overhead. */
export function Sparkline({
  data,
  width = 72,
  height = 22,
  stroke = 'var(--color-primary-text)',
  strokeWidth = 1.5,
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className={`overflow-visible flex-shrink-0 ${className}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
