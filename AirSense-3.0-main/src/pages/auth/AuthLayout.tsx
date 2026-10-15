import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AirSenseLogo, AirSenseMark } from '@/components/brand/AirSenseMark';
import { RISK_COLORS } from '@/data/indiaData';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-[#101314] text-[#E9EBEA]">
        {/* Fine reference grid */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(233,235,234,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(233,235,234,0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <Link to="/" className="relative inline-flex items-center gap-2.5 w-fit">
          <span className="grid place-items-center w-8 h-8 rounded-[7px] bg-white/[0.06] border border-white/10 text-[#8FBFA2]">
            <AirSenseMark className="w-[18px] h-[18px]" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight text-[15px]">AirSense</span>
            <span className="mono-label uppercase text-[#6E757A]">India</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="mono-label uppercase text-[#6E757A] mb-4">Environmental intelligence</p>
          <h2 className="text-[28px] leading-snug font-semibold tracking-tight mb-4">
            The air over India, rendered as data.
          </h2>
          <p className="text-[14px] leading-relaxed text-[#A3A9AC]">
            Methane hotspots, air quality stations and weather across forty cities — monitored
            continuously, classified by model, delivered with sources cited.
          </p>

          {/* Live network line */}
          <dl className="grid grid-cols-3 gap-px mt-10 rounded-lg overflow-hidden border border-white/10">
            {[
              { label: 'Sites', value: '24' },
              { label: 'Cities', value: '40' },
              { label: 'Stations', value: '20' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] px-4 py-3">
                <dd className="metric-value text-[18px] leading-none">{s.value}</dd>
                <dt className="mono-label uppercase text-[#6E757A] mt-1.5">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Severity legend footer */}
        <p className="relative mono-label uppercase text-[#6E757A] flex items-center gap-3">
          Risk scale
          {(['low', 'moderate', 'high', 'critical'] as const).map((lv) => (
            <span key={lv} className="inline-flex items-center gap-1 normal-case">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RISK_COLORS[lv] }} />
              {lv}
            </span>
          ))}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <AirSenseLogo size="sm" />
          </div>
          <h1 className="text-[21px] font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="text-[13.5px] text-secondary mt-1.5 mb-8 leading-relaxed">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
