import { Link } from 'react-router-dom';
import type { CinematicData } from './types';

interface ProvenanceNoteProps {
  data: CinematicData;
}

/**
 * Closing provenance block. Sits in normal flow after the last stage, so the
 * experience ends on sourced, verifiable information rather than a flourish.
 */
export function ProvenanceNote({ data }: ProvenanceNoteProps) {
  return (
    <footer className="cin-footer relative z-10">
      <div className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
        <div className="cin-footer-rule" />

        <div className="grid gap-9 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="cin-footer-brand">{data.brand.name}</p>
            <p className="cin-footer-line">
              {data.brand.descriptor} · India
            </p>
            <p className="cin-footer-line">{data.brand.tagline}</p>
          </div>

          <div className="lg:col-span-4">
            <p className="cin-footer-title">Data &amp; method</p>
            <ul className="cin-footer-list">
              {data.environment.sources.map((source) => (
                <li key={source.label}>
                  <span className="cin-footer-key">{source.label}</span>
                  <span className="cin-footer-val">{source.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="cin-footer-title">Continue</p>
            <ul className="cin-footer-links">
              <li>
                <Link to="/overview">Product overview</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/login">Sign in</Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="cin-footer-meta">
          The stylised outline used in this visualisation is a coarse representation for orientation,
          not a survey-grade boundary. Figures are indicative and update with the observation window.
        </p>
      </div>
    </footer>
  );
}