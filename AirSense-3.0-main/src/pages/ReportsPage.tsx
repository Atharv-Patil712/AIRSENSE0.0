import { useEffect, useState } from 'react';
import { FileText, Download, MapPin, FileBarChart, CheckCircle, ChevronDown, History } from 'lucide-react';
import { methaneService } from '@/services/methaneService';
import { aqiService } from '@/services/aqiService';
import { weatherService } from '@/services/weatherService';
import type { Hotspot, AqiObservation, WeatherObservation } from '@/types';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ReportHistoryItem {
  id: string;
  title: string;
  location_name: string | null;
  report_type: string;
  created_at: string;
  hotspotCount?: number;
  aqiCount?: number;
}

const HISTORY_LS_KEY = 'airsense-report-history';

function readLocalHistory(): ReportHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_LS_KEY) ?? '[]') as ReportHistoryItem[];
  } catch {
    return [];
  }
}

export function ReportsPage() {
  usePageTitle('Reports');
  const { user } = useAuth();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [aqiData, setAqiData] = useState<AqiObservation[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherObservation[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportSections, setReportSections] = useState<string[]>([]);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [hsRes, aqiRes, wxRes] = await Promise.all([
        methaneService.getHotspots(),
        aqiService.getAqiObservations(),
        weatherService.getWeatherObservations(),
      ]);
      setHotspots(hsRes.data);
      setAqiData(aqiRes.data);
      setWeatherData(wxRes.data);
      setIsDemo(hsRes.isDemo);
      setLoading(false);

      // Report history — Supabase first (per-user), localStorage as demo fallback
      try {
        if (user) {
          const { data } = await supabase
            .from('reports')
            .select('id, title, location_name, report_type, created_at, content')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (data && data.length > 0) {
            setHistory(
              data.map((r: Record<string, unknown>) => ({
                id: String(r.id),
                title: String(r.title),
                location_name: (r.location_name as string) ?? null,
                report_type: String(r.report_type ?? 'comprehensive'),
                created_at: String(r.created_at),
                hotspotCount: (r.content as { hotspotCount?: number })?.hotspotCount,
                aqiCount: (r.content as { aqiCount?: number })?.aqiCount,
              })),
            );
            return;
          }
        }
      } catch {
        /* fall through to local history */
      }
      setHistory(readLocalHistory());
    }
    load();
  }, [user]);

  const recordLocalHistory = () => {
    const item: ReportHistoryItem = {
      id: `local-${Date.now()}`,
      title: `Environmental Report — ${location || 'All India'}`,
      location_name: location || 'All India',
      report_type: 'comprehensive',
      created_at: new Date().toISOString(),
      hotspotCount: hotspots.length,
      aqiCount: aqiData.length,
    };
    try {
      localStorage.setItem(HISTORY_LS_KEY, JSON.stringify([item, ...readLocalHistory()].slice(0, 20)));
    } catch {
      /* ignore */
    }
    setHistory((prev) => [item, ...prev.filter((h) => !h.id.startsWith('local-'))]);
  };

  if (loading) return <LoadingSpinner label="Loading report data..." />;

  const generateReport = async () => {
    setGenerating(true);
    setGenerated(false);

    const locationHotspots = location
      ? hotspots.filter((h) => h.state?.toLowerCase().includes(location.toLowerCase()) || h.name.toLowerCase().includes(location.toLowerCase()))
      : hotspots;
    const locationAqi = location ? aqiData.filter((a) => a.city.toLowerCase().includes(location.toLowerCase()) || a.state?.toLowerCase().includes(location.toLowerCase())) : aqiData;

    const sections = [
      'Executive Summary',
      'Methane Overview',
      'Hotspot Analysis',
      'Source Classification',
      'AQI Analysis',
      'Weather Conditions',
      'Historical Trends',
      'AI Insights',
      'Risk Assessment',
      'Data Sources',
      'Limitations',
    ];

    setReportSections(sections);

    // Save report metadata
    if (user) {
      try {
        await supabase.from('reports').insert({
          user_id: user.id,
          title: `Environmental Report — ${location || 'All India'}`,
          location_name: location || 'All India',
          date_range_start: dateFrom || null,
          date_range_end: dateTo || null,
          report_type: 'comprehensive',
          parameters: { location, dateFrom, dateTo },
          content: { sections, hotspotCount: locationHotspots.length, aqiCount: locationAqi.length },
        });
      } catch (err) {
        console.error('Report save error:', err);
      }
    }

    setGenerating(false);
    setGenerated(true);
    recordLocalHistory();
  };

  const downloadCSV = () => {
    const rows = [
      ['Section', 'Content'],
      ['Report Title', `Environmental Report — ${location || 'All India'}`],
      ['Date Range', `${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`],
      ['Total Hotspots', String(hotspots.length)],
      ['Active Hotspots', String(hotspots.filter((h) => h.risk_level === 'high' || h.risk_level === 'critical').length)],
      ['AQI Stations', String(aqiData.length)],
      ['Weather Stations', String(weatherData.length)],
      ...hotspots.slice(0, 20).map((h) => ['Hotspot', `${h.hotspot_code},${h.name},${h.methane_index} ppb,${h.risk_level},${h.probable_source ?? 'unknown'}`]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airsense_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    // Generate a printable HTML report
    const reportHTML = `
      <html><head><title>AirSense India Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #17191B; }
        h1 { color: #3F6E54; } h2 { color: #355946; border-bottom: 1px solid #E5E5DF; padding-bottom: 8px; }
        .section { margin-bottom: 24px; } .stat { display: inline-block; margin-right: 24px; }
        .stat-value { font-size: 28px; font-weight: bold; color: #3F6E54; }
        .stat-label { font-size: 12px; color: #6E757A; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #E5E5DF; font-size: 12px; }
        th { background: #F0F0EC; font-weight: 600; }
        .disclaimer { margin-top: 40px; padding: 16px; background: #FAF6EC; border-radius: 8px; font-size: 11px; color: #9E7B2C; }
      </style></head>
      <body>
        <h1>AirSense — Environmental Intelligence Report</h1>
        <p>Location: ${location || 'All India'} | Date Range: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="section">
          <h2>1. Executive Summary</h2>
          <p>This report provides an overview of environmental conditions ${location ? `in ${location}` : 'across India'}.</p>
          <div class="stat"><div class="stat-value">${hotspots.length}</div><div class="stat-label">Total Hotspots</div></div>
          <div class="stat"><div class="stat-value">${hotspots.filter((h) => h.risk_level === 'high' || h.risk_level === 'critical').length}</div><div class="stat-label">Active Hotspots</div></div>
          <div class="stat"><div class="stat-value">${aqiData.length}</div><div class="stat-label">AQI Stations</div></div>
        </div>
        <div class="section">
          <h2>2. Methane Overview</h2>
          <p>Highest methane concentration: ${Math.max(...hotspots.map((h) => h.methane_index), 0)} ppb</p>
        </div>
        <div class="section">
          <h2>3. Hotspot Analysis</h2>
          <table><tr><th>Code</th><th>Name</th><th>Methane (ppb)</th><th>Risk</th><th>Source</th></tr>
          ${hotspots.slice(0, 20).map((h) => `<tr><td>${h.hotspot_code}</td><td>${h.name}</td><td>${h.methane_index}</td><td>${h.risk_level}</td><td>${h.probable_source ?? 'unknown'}</td></tr>`).join('')}
          </table>
        </div>
        <div class="section">
          <h2>4. AQI Analysis</h2>
          <table><tr><th>City</th><th>AQI</th><th>Dominant Pollutant</th></tr>
          ${aqiData.slice(0, 20).map((a) => `<tr><td>${a.city}</td><td>${a.aqi}</td><td>${a.dominant_pollutant ?? 'N/A'}</td></tr>`).join('')}
          </table>
        </div>
        <div class="section">
          <h2>5. Weather Conditions</h2>
          <table><tr><th>City</th><th>Temp</th><th>Wind</th><th>Humidity</th></tr>
          ${weatherData.slice(0, 10).map((w) => `<tr><td>${w.city}</td><td>${w.temperature}°C</td><td>${w.wind_speed} km/h</td><td>${w.humidity}%</td></tr>`).join('')}
          </table>
        </div>
        <div class="section">
          <h2>10. Data Sources</h2>
                    <p>${isDemo ? 'AirSense reference dataset' : 'Satellite observations, government datasets, weather and AQI APIs'}</p>
        </div>
        <div class="disclaimer">
          AirSense India is an environmental monitoring and analytical platform. Methane measurements, source classifications,
                    risk scores, predictions and projections may contain uncertainty and should not be treated as definitive scientific attribution
          without independent verification.
        </div>
      </body></html>
    `;
    // Open styled report in a new window and trigger the system Print/PDF dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      // Fallback if popup blocker intercepted the print window
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airsense_report_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Reports"
        description="Generate comprehensive environmental intelligence reports for any location"
        meta={<MetaLine>PDF · CSV export</MetaLine>}
        actions={<DemoBadge show={isDemo} />}
      />

      {/* Report configuration */}
      <div className="surface p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-primary-500" /> Report Configuration
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Maharashtra, Delhi, Pune"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
              <span className="text-muted">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>
        <button onClick={generateReport} disabled={generating} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
          <FileText className="w-5 h-5" /> {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Generated report */}
      {generated && (
        <div className="surface p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success-500" />
            <h3 className="text-lg font-semibold">Report Generated Successfully</h3>
          </div>
          <p className="text-sm text-muted mb-4">
            Environmental Report — {location || 'All India'}
            {dateFrom && dateTo && ` (${dateFrom} to ${dateTo})`}
          </p>

          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Report Sections:</p>
            {reportSections.map((s, i) => (
              <div key={s} className="flex items-center gap-3 p-2 surface-2 rounded-lg">
                <span className="text-xs font-bold text-primary-500 w-6">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-primary-500">{hotspots.length}</p>
              <p className="text-xs text-muted">Hotspots Analyzed</p>
            </div>
            <div className="surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-info-500">{aqiData.length}</p>
              <p className="text-xs text-muted">AQI Stations</p>
            </div>
            <div className="surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-accent-500">{weatherData.length}</p>
              <p className="text-xs text-muted">Weather Records</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={downloadPDF} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={downloadCSV} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">
            Source: {isDemo ? 'AirSense reference dataset' : 'Connected environmental sources'}
          </p>
        </div>
      )}

      {/* Report history */}
      <Panel flush title="Report history" description={`${history.length} generated · newest first`} className="animate-fade-up">
        <ul className="divide-rule">
          {history.slice(0, 8).map((r) => {
            const isExpanded = expandedReport === r.id;
            return (
              <li key={r.id}>
                <button
                  onClick={() => setExpandedReport(isExpanded ? null : r.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                  aria-expanded={isExpanded}
                >
                  <FileBarChart className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{r.title}</span>
                    <span className="block mono-label uppercase text-muted mt-0.5">
                      {timeAgo(r.created_at)} · {r.report_type}
                    </span>
                  </span>
                  {typeof r.hotspotCount === 'number' && (
                    <span className="mono-label uppercase text-muted hidden sm:block tnum">{r.hotspotCount} sites</span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 animate-fade-in">
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 mb-3">
                      {[
                        { label: 'Location', value: r.location_name ?? 'All India' },
                        { label: 'Type', value: r.report_type },
                        { label: 'Hotspots', value: r.hotspotCount != null ? String(r.hotspotCount) : '—' },
                        { label: 'AQI stations', value: r.aqiCount != null ? String(r.aqiCount) : '—' },
                      ].map((row) => (
                        <div key={row.label}>
                          <dt className="kicker mb-0.5">{row.label}</dt>
                          <dd className="text-xs text-secondary truncate">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Preview shows stored metadata. Use “Export CSV” above to regenerate a download with current data.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
          {history.length === 0 && (
            <li>
              <EmptyState
                icon={History}
                title="No reports yet"
                description="Generate your first report and it will appear here."
              />
            </li>
          )}
        </ul>
      </Panel>

      {/* Report sections info */}
      <div className="surface p-5">
        <h3 className="text-sm font-semibold mb-3">Report Includes:</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Executive Summary', 'Methane Overview', 'Hotspot Analysis', 'Source Classification', 'AQI Analysis', 'Weather Conditions', 'Historical Trends', 'AI Insights', 'Risk Assessment', 'Data Sources', 'Limitations'].map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle className="w-3.5 h-3.5 text-success-500" /> {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
