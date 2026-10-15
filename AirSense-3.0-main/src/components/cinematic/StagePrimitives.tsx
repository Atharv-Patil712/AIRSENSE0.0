import type { ReactNode } from 'react';
import { SEVERITY_COLORS, FALLBACK_SEVERITY_COLOR } from './palette';
import type { CinematicSite } from './types';

/* Small, dependency-free presentation primitives shared by the stages.
   They exist so every stage reports data the same way. */

export function Metric({
  label,
  value,
  unit,
  tone = 'default',
  note,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: 'default' | 'accent' | 'blue' | 'clean' | 'warn' | 'violet' | 'danger';
  note?: ReactNode;
}) {
  return (
    <div className="cin-cell">
      <p className="cin-cell-label">{label}</p>
      <p className={`cin-cell-value cin-tone-${tone}`}>
        {value}
        {unit && <span className="cin-cell-unit">{unit}</span>}
      </p>
      {note && <p className="cin-cell-note">{note}</p>}
    </div>
  );
}

export function MetricRow({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 }) {
  return (
    <div
      className={`cin-grid gap-px grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}
    >
      {children}
    </div>
  );
}

export function RiskTag({ level }: { level: string }) {
  return (
    <span className="cin-tag">
      <span
        className="cin-dot"
        style={{
          backgroundColor: SEVERITY_COLORS[level as keyof typeof SEVERITY_COLORS] ?? FALLBACK_SEVERITY_COLOR,
        }}
      />
      {level}
    </span>
  );
}

export function SiteList({
  sites,
  unit,
  limit = 5,
  showValue = true,
}: {
  sites: CinematicSite[];
  unit: string;
  limit?: number;
  showValue?: boolean;
}) {
  const visible = sites.slice(0, limit);

  return (
    <ul className="cin-list">
      {visible.map((site) => (
        <li key={site.id} className="cin-list-row">
          <span className="cin-list-name">
            <span
              className="cin-dot"
              style={{
                backgroundColor:
                  SEVERITY_COLORS[site.level] ?? FALLBACK_SEVERITY_COLOR,
              }}
            />
            {site.name}
          </span>
          {showValue && (
            <span className="cin-list-value">
              {site.value}
              <span className="cin-unit">{unit}</span>
            </span>
          )}
        </li>
      ))}
      {visible.length === 0 && <li className="cin-list-empty">No sites reported in this window.</li>}
    </ul>
  );
}

export function NoteBox({
  title,
  children,
  tone = 'accent',
}: {
  title: string;
  children: ReactNode;
  tone?: 'accent' | 'warn' | 'violet' | 'indigo';
}) {
  return (
    <div className={`cin-note cin-note-${tone}`}>
      <p className="cin-note-title">{title}</p>
      <p className="cin-note-body">{children}</p>
    </div>
  );
}

export function Card({
  title,
  meta,
  children,
  className = '',
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`cin-card ${className}`}>
      {(title || meta) && (
        <div className="cin-card-head">
          {title && <p className="cin-card-title">{title}</p>}
          {meta && <span className="cin-card-meta">{meta}</span>}
        </div>
      )}
      <div className="cin-card-body">{children}</div>
    </div>
  );
}