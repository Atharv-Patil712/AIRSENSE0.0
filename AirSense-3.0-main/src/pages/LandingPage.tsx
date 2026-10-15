import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Wind, Sparkles, Activity, Bell, Compass, Radio, MapPin } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { AirSenseLogo, AirSenseMark } from '@/components/brand/AirSenseMark';
import { RISK_COLORS, getAqiCategory } from '@/data/indiaData';
import { generateDemoAqiObservations, generateDemoHotspots, generateAqiTrend } from '@/data/demoData';
import {
  CHART_COLORS,
  chartTick,
  chartAxisLine,
  chartGridStroke,
  tooltipContentStyle,
} from '@/components/ui/chartTheme';


const steps = [
  {
    n: '01',
    title: 'Observe',
    desc: 'Satellite passes, government datasets and station feeds stream into one normalized store.',
  },
  {
    n: '02',
    title: 'Analyze',
    desc: 'Rule-based models classify sources, score risk and project near-term trends per site.',
  },
  {
    n: '03',
    title: 'Act',
    desc: 'Ranked tables, maps and alerts surface what needs attention — with sources cited throughout.',
  },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/">
            <AirSenseLogo size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[13px] text-secondary">
            <a href="#features" className="hover:text-[var(--color-text)] transition-colors">Capabilities</a>
            <a href="#how" className="hover:text-[var(--color-text)] transition-colors">Method</a>
            <a href="#data" className="hover:text-[var(--color-text)] transition-colors">Data</a>
          </div>
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link to="/dashboard" className="btn-primary !py-1.5 !px-3.5 !text-[13px]">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-[13px] font-medium text-secondary hover:text-[var(--color-text)] transition-colors px-2 py-1.5">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary !py-1.5 !px-3.5 !text-[13px]">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient atmospheric backdrop glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-sky-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 -right-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(var(--chart-grid) 1px, transparent 1px), linear-gradient(90deg, var(--chart-grid) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 80%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 text-xs font-semibold mb-6 animate-fade-in shadow-xs backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Real-Time Environmental Intelligence Platform</span>
          </div>

          <h1 className="text-[42px] sm:text-[62px] leading-[1.04] font-bold tracking-tightest max-w-3xl animate-fade-in text-[var(--color-text)]">
            Measure the atmosphere.<br />
            <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 bg-clip-text text-transparent">
              Understand the risk.
            </span>
          </h1>

          <p className="text-secondary text-[16px] sm:text-lg leading-relaxed max-w-2xl mt-6 animate-fade-in">
            AirSense tracks methane hotspots, air quality and weather across forty Indian cities —
            turning raw observations into clear, decision-ready environmental insight.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-8 animate-fade-in">
            <Link to={user ? '/dashboard' : '/signup'} className="btn-primary !py-3 !px-6 text-sm shadow-md hover:shadow-lg">
              {user ? 'Open dashboard' : 'Create an account'} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to={user ? '/map' : '/login'} className="btn-secondary !py-3 !px-6 text-sm">
              View live map
            </Link>
          </div>

          {/* Network stats - modern responsive card grid with hover lift */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 animate-fade-up">
            {[
              { label: 'Methane sites', value: '24', icon: Flame, color: 'text-amber-500' },
              { label: 'Cities monitored', value: '40', icon: MapPin, color: 'text-sky-500' },
              { label: 'AQI stations', value: '20', icon: Radio, color: 'text-emerald-500' },
              { label: 'Live alerts', value: '07', icon: Bell, color: 'text-rose-500' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group relative p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-sky-400 to-emerald-400 opacity-80 group-hover:h-1 transition-all" />
                  <div className="flex items-center justify-between mb-2">
                    <p className="kicker !text-[11px] text-muted group-hover:text-[var(--color-text)] transition-colors">{s.label}</p>
                    <Icon className={`w-4 h-4 ${s.color} transition-transform duration-200 group-hover:scale-110`} />
                  </div>
                  <p className="metric-value text-[30px] sm:text-[34px] font-bold leading-none bg-gradient-to-r from-[var(--color-text)] to-sky-600 dark:to-sky-400 bg-clip-text text-transparent">
                    {s.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Network preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="surface shadow-panel rounded-2xl overflow-hidden animate-fade-up border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
              <span className="text-[14px] font-semibold tracking-tight text-[var(--color-text)]">Monitoring network telemetry</span>
            </div>
            <span className="mono-label uppercase text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-muted hidden sm:inline">Representative view</span>
          </div>
          <NetworkPreview />
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-[var(--color-border)]">
            <p className="text-xs text-muted">
              Hotspot severity, station coverage and risk zones — rendered from one consistent visual language.
            </p>
            <Link to={user ? '/map' : '/login'} className="link text-xs inline-flex items-center gap-1 font-semibold">
              Explore the full map <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Product preview — the actual interface, fed by demo data */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="kicker mb-2 text-sky-600 dark:text-sky-400 font-bold">The interface</p>
            <h2 className="text-[26px] sm:text-3xl font-bold tracking-tight max-w-xl leading-snug">
              Dense information, made scannable.
            </h2>
          </div>
        </div>
        <ProductPreview />
      </section>

      {/* Capabilities */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-2xl">
          <p className="kicker mb-2 text-sky-600 dark:text-sky-400 font-bold">Capabilities</p>
          <h2 className="text-[28px] sm:text-3xl font-bold tracking-tight leading-snug">
            One unified platform for environmental conditions.
          </h2>
          <p className="text-secondary text-sm mt-2">
            Engineered for municipal authorities, researchers, and facility managers across India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {[
            {
              n: '01',
              title: 'Methane hotspot detection',
              desc: 'Satellite and sensor observations pinpoint active methane concentration sites across the subcontinent.',
              icon: Flame,
            },
            {
              n: '02',
              title: 'Air quality monitoring',
              desc: 'Continuous AQI tracking with pollutant-level breakdowns — PM2.5, PM10, NO₂, SO₂, CO and O₃.',
              icon: Wind,
            },
            {
              n: '03',
              title: 'AI source classification',
              desc: 'A rule-based model attributes probable emission sources: landfills, agriculture, oil & gas and more.',
              icon: Sparkles,
            },
            {
              n: '04',
              title: 'Predictive analytics',
              desc: 'Historical trends, weather and location signals combine into forward-looking risk estimates.',
              icon: Activity,
            },
            {
              n: '05',
              title: 'Environmental alerts',
              desc: 'Automated notifications when conditions cross defined thresholds — before they become events.',
              icon: Bell,
            },
            {
              n: '06',
              title: 'Weather & wind tracking',
              desc: 'Temperature, humidity, pressure and wind direction contextualise every measurement.',
              icon: Compass,
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.n}
                className="group p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-500/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="mono-label text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-muted">
                    {c.n}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold tracking-tight text-[var(--color-text)] mb-2 group-hover:text-sky-500 transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed font-normal">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Process */}
      <section id="how" className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/40 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="kicker mb-2 text-sky-600 dark:text-sky-400 font-bold">Method</p>
            <h2 className="text-[28px] sm:text-3xl font-bold tracking-tight leading-snug">
              From observation to action, in three steps.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {steps.map((s) => (
              <div
                key={s.n}
                className="group p-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <span className="inline-block mono-label font-bold text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 mb-4">
                  STEP {s.n}
                </span>
                <h3 className="text-[18px] font-bold tracking-tight text-[var(--color-text)] mb-2 group-hover:text-sky-500 transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section id="data" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-16">
          <div>
            <p className="kicker mb-3">Data provenance</p>
            <h2 className="text-[26px] sm:text-3xl font-semibold tracking-tight leading-snug">
              Every number shows where it came from.
            </h2>
            <p className="text-sm text-secondary leading-relaxed mt-4 max-w-sm">
              Source details, observation times and confidence indicators keep environmental
              intelligence traceable from the first reading to the final report.
            </p>
          </div>
          <ul className="divide-rule border-t border-[var(--color-border)]">
            {['Satellite observations', 'Government datasets', 'Weather services', 'Air quality APIs', 'User-uploaded data', 'Simulated / demo data'].map((src, i) => (
              <li key={src} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                <span className="text-sm text-secondary">{src}</span>
                <span className="mono-label uppercase text-muted">{i === 5 ? 'Labelled' : 'Cited'}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-[10px] border border-[var(--color-border)] px-5 py-4 flex items-start gap-2.5">
          <span className="status-dot bg-warning-500 mt-[7px] flex-shrink-0" />
          <p className="text-xs text-muted leading-relaxed max-w-3xl">
            AirSense is an environmental monitoring and analytical platform. Methane measurements,
            source classifications, risk scores and predictions may contain uncertainty and should not
            be treated as definitive scientific attribution without independent verification.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <AirSenseMark className="w-8 h-8 mx-auto text-primary-500 mb-6" />
          <h2 className="text-[26px] sm:text-3xl font-semibold tracking-tight max-w-lg mx-auto leading-snug">
            Start reading the air over India today.
          </h2>
          <p className="text-sm text-secondary mt-4 max-w-md mx-auto">
            Free accounts include the full dashboard, map, alerts and reports.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to={user ? '/dashboard' : '/signup'} className="btn-primary !py-2.5 !px-6">
              {user ? 'Open dashboard' : 'Get started'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <AirSenseLogo size="sm" />
          <p className="text-xs text-muted">Environmental intelligence platform</p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Product preview — the real dashboard language (metrics row, trend chart,
 * ranked table) fed by the app's own seeded demo generators.
 */
function ProductPreview() {
  const { user } = useAuth();
  const data = useMemo(() => {
    const hotspots = generateDemoHotspots();
    const aqi = generateDemoAqiObservations();
    const trend = generateAqiTrend(30, 160, 7);
    const peak = [...hotspots].sort((a, b) => b.methane_index - a.methane_index)[0];
    const medianAqi = Math.round([...aqi].sort((a, b) => a.aqi - b.aqi)[Math.floor(aqi.length / 2)]?.aqi ?? 0);
    const activeCount = hotspots.filter((h) => h.risk_level === 'high' || h.risk_level === 'critical').length;
    return { hotspots: hotspots.slice(0, 4), trend, peak, medianAqi, activeCount };
  }, []);

  return (
    <div className="surface shadow-panel overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-primary-500" />
          <span className="text-[13px] font-medium tracking-tight">Dashboard · Environmental Intelligence</span>
        </div>
        <span className="mono-label uppercase text-muted">Reference data</span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-px bg-[var(--color-border)] border-b border-[var(--color-border)]">
        {[
          { label: 'Peak methane', value: `${data.peak?.methane_index ?? 0}`, unit: 'ppb' },
          { label: 'Median AQI', value: `${data.medianAqi}`, unit: '' },
          { label: 'Active hotspots', value: `${data.activeCount}`, unit: '/ 24' },
        ].map((m) => (
          <div key={m.label} className="bg-[var(--color-surface)] px-5 py-4">
            <p className="kicker mb-1.5">{m.label}</p>
            <p className="metric-value text-[22px] leading-none">
              {m.value}
              {m.unit && <span className="text-xs text-muted font-normal ml-1">{m.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-px bg-[var(--color-border)]">
        {/* Trend chart */}
        <div className="bg-[var(--color-surface)] p-5">
          <p className="kicker mb-3">AQI trend · 30 days</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="landingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.secondarySoft} />
                  <stop offset="100%" stopColor="rgba(78,122,142,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="date" tick={chartTick} axisLine={chartAxisLine} tickLine={false} interval={9} dy={4} />
              <YAxis tick={chartTick} axisLine={false} tickLine={false} width={38} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke={CHART_COLORS.secondary}
                strokeWidth={1.75}
                fill="url(#landingGrad)"
                dot={false}
                name="AQI"
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked fragment */}
        <div className="bg-[var(--color-surface)] p-5">
          <p className="kicker mb-3">Top hotspots by CH₄</p>
          <ul className="divide-rule">
            {data.hotspots.map((h, i) => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="mono-label text-muted w-5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[13px] truncate">{h.name}</span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="metric-value text-[13px]" style={{ color: RISK_COLORS[h.risk_level] }}>
                    {h.methane_index}
                  </span>
                  <span className="status-dot" style={{ backgroundColor: RISK_COLORS[h.risk_level] }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-[var(--color-border)]">
        <p className="text-xs text-muted">
          Median air quality reads{' '}
          <span className="font-medium text-secondary">{getAqiCategory(data.medianAqi).label}</span> across the network
          snapshot.
        </p>
        <Link to={user ? '/dashboard' : '/signup'} className="link text-xs inline-flex items-center gap-1">
          Explore the dashboard <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

/** Restrained static network visualization for the landing page. */
function NetworkPreview() {
  const sites = [
    { name: 'Delhi', x: 31, y: 21, level: 'critical', v: 2340 },
    { name: 'Lucknow', x: 41, y: 27, level: 'high', v: 2210 },
    { name: 'Kolkata', x: 68, y: 44, level: 'high', v: 2150 },
    { name: 'Mumbai', x: 17, y: 62, level: 'moderate', v: 1980 },
    { name: 'Bhopal', x: 34, y: 48, level: 'moderate', v: 2010 },
    { name: 'Chennai', x: 44, y: 84, level: 'low', v: 1890 },
    { name: 'Guwahati', x: 82, y: 30, level: 'low', v: 1860 },
  ];
  const stations = [
    { x: 28, y: 18 }, { x: 36, y: 33 }, { x: 52, y: 40 }, { x: 22, y: 55 },
    { x: 48, y: 62 }, { x: 40, y: 78 }, { x: 64, y: 52 }, { x: 74, y: 38 },
  ];

  return (
    <div
      className="relative h-[320px] sm:h-[380px] bg-[var(--color-surface-2)]"
      style={{
        backgroundImage:
          'linear-gradient(var(--chart-grid) 1px, transparent 1px), linear-gradient(90deg, var(--chart-grid) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {stations.map((s, i) => (
        <span
          key={`st-${i}`}
          className="absolute w-2 h-2 rounded-full border border-accent-500/70 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
      {sites.map((s) => {
        const size = 6 + Math.min(Math.max((s.v - 1850) / 55, 0), 8);
        return (
          <span
            key={s.name}
            className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-[var(--color-surface-2)]"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: RISK_COLORS[s.level],
              opacity: 0.88,
            }}
          />
        );
      })}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 surface !rounded-md px-2.5 py-1.5 shadow-panel">
        {(['critical', 'high', 'moderate', 'low'] as const).map((lv) => (
          <span key={lv} className="flex items-center gap-1.5 mono-label uppercase text-muted">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RISK_COLORS[lv] }} />
            {lv}
          </span>
        ))}
        <span className="flex items-center gap-1.5 mono-label uppercase text-muted">
          <span className="w-1.5 h-1.5 rounded-full border border-accent-500" />
          Station
        </span>
      </div>
    </div>
  );
}
