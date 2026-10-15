
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Radio,
  Layers,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';

// Mock datasets for historical time-series gas trends
const METHANE_SERIES_MAP = {
  '24h': [
    { time: '00:00', ppm: 1.83, baseline: 1.88 },
    { time: '03:00', ppm: 1.85, baseline: 1.88 },
    { time: '06:00', ppm: 1.82, baseline: 1.88 },
    { time: '09:00', ppm: 1.91, baseline: 1.88 },
    { time: '12:00', ppm: 2.15, baseline: 1.88 },
    { time: '15:00', ppm: 2.45, baseline: 1.88 },
    { time: '18:00', ppm: 1.98, baseline: 1.88 },
    { time: '21:00', ppm: 1.89, baseline: 1.88 },
    { time: 'Now',   ppm: 1.88, baseline: 1.88 },
  ],
  '7d': [
    { time: 'Mon', ppm: 1.84, baseline: 1.88 },
    { time: 'Tue', ppm: 1.86, baseline: 1.88 },
    { time: 'Wed', ppm: 1.92, baseline: 1.88 },
    { time: 'Thu', ppm: 2.38, baseline: 1.88 },
    { time: 'Fri', ppm: 2.01, baseline: 1.88 },
    { time: 'Sat', ppm: 1.87, baseline: 1.88 },
    { time: 'Sun', ppm: 1.88, baseline: 1.88 },
  ],
  '30d': [
    { time: 'Week 1', ppm: 1.84, baseline: 1.88 },
    { time: 'Week 2', ppm: 1.96, baseline: 1.88 },
    { time: 'Week 3', ppm: 2.21, baseline: 1.88 },
    { time: 'Week 4', ppm: 1.88, baseline: 1.88 },
  ],
};

// Recent sensor log entries for the Alert Matrix List
interface SensorLog {
  id: string;
  timestamp: string;
  sensorId: string;
  zone: string;
  reading: string;
  status: 'Leak Detected' | 'Maintenance Needed' | 'Elevated Plume' | 'Nominal Baseline';
  priority: 'critical' | 'warning' | 'elevated' | 'nominal';
  action: string;
}

const SENSOR_ALERT_LOGS: SensorLog[] = [
  {
    id: 'LOG-8821',
    timestamp: '3 mins ago',
    sensorId: 'SN-CH4-084',
    zone: 'Zone 7-B · North Landfill',
    reading: '2.45 ppm',
    status: 'Leak Detected',
    priority: 'critical',
    action: 'Auto-isolation valve engaged · Team notified',
  },
  {
    id: 'LOG-8819',
    timestamp: '24 mins ago',
    sensorId: 'SN-CH4-012',
    zone: 'Zone 3-A · Industrial Ridge',
    reading: '1.92 ppm',
    status: 'Maintenance Needed',
    priority: 'warning',
    action: 'Laser sensor calibration scheduled',
  },
  {
    id: 'LOG-8815',
    timestamp: '1 hour ago',
    sensorId: 'SN-CH4-105',
    zone: 'Zone 1-C · Agri-Biomass Site',
    reading: '2.08 ppm',
    status: 'Elevated Plume',
    priority: 'elevated',
    action: 'UAV drone boundary sweep dispatched',
  },
  {
    id: 'LOG-8809',
    timestamp: '3 hours ago',
    sensorId: 'SN-CH4-044',
    zone: 'Zone 5-D · Urban Perimeter',
    reading: '1.81 ppm',
    status: 'Nominal Baseline',
    priority: 'nominal',
    action: 'Continuous spectrometry nominal',
  },
  {
    id: 'LOG-8803',
    timestamp: '5 hours ago',
    sensorId: 'SN-CH4-092',
    zone: 'Zone 2-F · Petrochem Terminal',
    reading: '2.31 ppm',
    status: 'Leak Detected',
    priority: 'critical',
    action: 'Containment scrubber initiated',
  },
];

export function DashboardPage() {
  usePageTitle('EVS Methane Detection Dashboard');
  const [activeRange, setActiveRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredLogs = SENSOR_ALERT_LOGS.filter((log) => {
    if (filterPriority === 'all') return true;
    return log.priority === filterPriority;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastSyncTime('Just now');
    }, 600);
  };

  const chartData = METHANE_SERIES_MAP[activeRange];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ─────────────────────────────────────────────────────────────
          MODULE 1: HERO METRIC HEADER
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Ambient atmospheric aura */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            {/* Context meta & Green Pulse Indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Environmental Studies (EVS) · Atmospheric Methane Observatory
              </span>
              
              {/* System Active green pulse badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                role="status"
                aria-label="System status: Active"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>System Active</span>
              </div>
            </div>

            {/* Readout Hero */}
            <div>
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                Average Methane Levels
              </p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <h1
                  id="hero-heading"
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-mono"
                >
                  1.88
                </h1>
                <span className="text-2xl sm:text-3xl font-semibold text-emerald-400 font-sans">
                  ppm
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400/90 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Within Safe Atmospheric Baseline
                </span>
                <span className="text-slate-600">·</span>
                <span>Global tropospheric standard ~1.80–1.92 ppm</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-slate-500">Telemetry sync: {lastSyncTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60 transition-all hover:border-slate-600 active:scale-95 disabled:opacity-50"
              aria-label="Sync live telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>Sync Telemetry</span>
            </button>
            <Link
              to="/map"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <span>Spatial Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 2: DATA GRID PANELS (3 SUMMARY CARDS)
          ───────────────────────────────────────────────────────────── */}
      <section aria-label="Summary Data Grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Summary Card 1: Total Monitored Zones */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700/80 transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Total Monitored Zones
            </span>
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white">24</span>
            <span className="text-xs font-medium text-emerald-400">Sectors Online</span>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">
            100% regional telemetry grid coverage across industrial & municipal sectors.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>High Activity: 4 Sectors</span>
            <span className="text-emerald-400">0 Blindspots</span>
          </div>
        </div>

        {/* Summary Card 2: Peak Emission Level (24h) */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700/80 transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Peak Emission Level (24h)
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white">2.45</span>
            <span className="text-xs font-semibold text-rose-400 font-mono">ppm</span>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">
            Zone 7-B (North Landfill) · +30.3% excursion over background standard.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Duration: 18 mins</span>
            <span className="text-rose-400 font-semibold">Flagged</span>
          </div>
        </div>

        {/* Summary Card 3: Active Sensor Count */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700/80 transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Sensor Count
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-white">142</span>
            <span className="text-xs text-slate-400 font-mono">/ 144 Sensors</span>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">
            98.6% operational health rate · 2 optical nodes undergoing calibration.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Laser Spectrometry: 98.6%</span>
            <span className="text-emerald-400">Uptime Nominal</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 3: INTERACTIVE ANALYTICS BLOCK
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="analytics-heading" className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="analytics-heading" className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Historical Gas Trends · Atmospheric CH₄ (ppm)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Time-series continuous infrared laser absorption telemetry
            </p>
          </div>

          {/* Time range selector pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  activeRange === range
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                aria-pressed={activeRange === range}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Current Baseline</span>
            <p className="text-emerald-400 font-bold text-sm">1.88 ppm</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Period Minimum</span>
            <p className="text-slate-200 font-bold text-sm">1.82 ppm</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Period Peak</span>
            <p className="text-rose-400 font-bold text-sm">2.45 ppm</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Absorption Index</span>
            <p className="text-sky-400 font-bold text-sm">99.4% SNR</p>
          </div>
        </div>

        {/* Time-series Line Chart Display Area */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ch4Glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                domain={[1.7, 2.6]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}
                formatter={(val) => [val != null ? `${Number(val).toFixed(2)} ppm` : '', 'CH₄ Methane']}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#475569"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Safe Baseline"
              />
              <Line
                type="monotone"
                dataKey="ppm"
                stroke="#34d399"
                strokeWidth={2.75}
                dot={{ fill: '#10b981', r: 3.5, strokeWidth: 1, stroke: '#022c22' }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                name="CH₄ Observed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 4: ALERT MATRIX LIST
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="alerts-heading" className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="alerts-heading" className="text-base sm:text-lg font-semibold text-white">
              Alert Matrix Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sensor telemetry events and automated protocol execution logs
            </p>
          </div>

          {/* Priority filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'critical', label: 'Leak Detected' },
              { id: 'warning', label: 'Maintenance' },
              { id: 'nominal', label: 'Nominal' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterPriority(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterPriority === f.id
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Sensor Node / Zone</th>
                <th className="py-3 px-5">Gas Reading</th>
                <th className="py-3 px-5">Priority Status</th>
                <th className="py-3 px-5">Action Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log) => {
                const isLeak = log.priority === 'critical';
                const isWarn = log.priority === 'warning';
                const isElev = log.priority === 'elevated';

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-slate-200">{log.zone}</p>
                      <span className="font-mono text-[10px] text-slate-500">{log.sensorId}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-100 whitespace-nowrap">
                      {log.reading}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          isLeak
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isWarn
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isElev
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLeak
                              ? 'bg-rose-400 animate-pulse'
                              : isWarn
                              ? 'bg-amber-400'
                              : isElev
                              ? 'bg-orange-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-sans">
                      {log.action}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    No logs matching filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
