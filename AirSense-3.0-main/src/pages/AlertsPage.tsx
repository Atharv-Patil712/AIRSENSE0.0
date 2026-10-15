import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, Mail, MailOpen } from 'lucide-react';
import { alertService } from '@/services/alertService';
import type { EnvironmentalAlert } from '@/types';
import { SEVERITY_COLORS } from '@/data/indiaData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader, MetaLine } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SeverityBadge } from '@/components/ui/Badges';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

const FILTERS = ['all', 'critical', 'high', 'medium', 'low'] as const;
type Filter = (typeof FILTERS)[number];
type SortMode = 'recent' | 'severity';

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function AlertsPage() {
  usePageTitle('Alerts');
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Optimistic read state layered over server/demo data
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const res = await alertService.getAlerts();
      setAlerts(res.data);
      setIsDemo(res.isDemo);
      setLoading(false);
    }
    load();
  }, []);

  const effectiveRead = (alert: EnvironmentalAlert) => readOverrides[alert.id] ?? alert.is_read;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts.length };
    for (const s of ['critical', 'high', 'medium', 'low']) {
      c[s] = alerts.filter((a) => a.severity === s).length;
    }
    return c;
  }, [alerts]);

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);
    const sorted = [...filtered];
    if (sort === 'severity') {
      sorted.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
    } else {
      sorted.sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime());
    }
    return sorted;
  }, [alerts, filter, sort]);

  const unreadCount = alerts.filter((a) => !effectiveRead(a)).length;

  const toggleRead = async (alert: EnvironmentalAlert) => {
    const next = !effectiveRead(alert);
    setReadOverrides((prev) => ({ ...prev, [alert.id]: next }));
    if (!alert.id.startsWith('demo-') && next) {
      await alertService.markAsRead(alert.id);
    }
  };

  const markAllRead = async () => {
    const overrides: Record<string, boolean> = {};
    alerts.forEach((a) => {
      overrides[a.id] = true;
    });
    setReadOverrides((prev) => ({ ...prev, ...overrides }));
    const persistable = alerts.filter((a) => !a.id.startsWith('demo-') && !effectiveRead(a));
    await Promise.allSettled(persistable.map((a) => alertService.markAsRead(a.id)));
  };

  if (loading) return <LoadingSpinner label="Loading alerts…" />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="Alert center"
        description="Automated notifications for methane events, poor air quality and unusual patterns"
        meta={<MetaLine>{counts.all} total · {counts.critical} critical · {unreadCount} unread</MetaLine>}
        actions={
          <>
            <DemoBadge show={isDemo} />
            {unreadCount > 0 && (
              <button onClick={() => void markAllRead()} className="btn-secondary !py-1.5 !px-3 text-[13px] gap-1.5">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Filter>
          ariaLabel="Filter by severity"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((sev) => ({
            value: sev,
            label: sev === 'all' ? 'All' : sev,
            count: counts[sev],
            dotColor: sev === 'all' ? undefined : SEVERITY_COLORS[sev],
          }))}
        />
        <div className="flex items-center gap-2">
          <span className="mono-label uppercase text-muted">Sort</span>
          <SegmentedControl<SortMode>
            size="sm"
            ariaLabel="Sort alerts"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'Newest' },
              { value: 'severity', label: 'Severity' },
            ]}
          />
        </div>
      </div>

      {/* Alert list */}
      <Panel flush bodyClassName="!px-0" className="animate-fade-up">
        <ul className="divide-rule">


          {visible.map((alert) => {
            const isRead = effectiveRead(alert);
            const isExpanded = expandedId === alert.id;
            return (
              <li key={alert.id} className="relative">
                <span
                  className="absolute left-0 top-3 bottom-3 w-[2.5px] rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[alert.severity], opacity: isRead ? 0.28 : 0.9 }}
                />
                <div className="pl-4 pr-4 sm:pl-6 py-4 transition-colors hover:bg-[var(--color-surface-2)]">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="min-w-0 flex-1 text-left group"
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" aria-label="Unread" />
                        )}
                        <h3 className={`text-[14px] ${isRead ? 'font-normal text-secondary' : 'font-medium'}`}>
                          {alert.location_name}
                        </h3>
                        <SeverityBadge severity={alert.severity} />
                        <span className="mono-label uppercase text-muted hidden sm:inline">
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[13px] text-secondary mt-1 leading-relaxed line-clamp-2">{alert.reason}</p>
                      <p className="mono-label uppercase text-muted mt-2">
                        {timeAgo(alert.triggered_at)} · {alert.state ?? '—'} ·{' '}
                        {alert.data_source === 'simulated' ? 'Simulated' : 'System'}
                      </p>
                    </button>

                    <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                      <button
                        onClick={() => void toggleRead(alert)}
                        className="btn-ghost !p-1.5"
                        title={isRead ? 'Mark as unread' : 'Mark as read'}
                        aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {isRead ? (
                          <MailOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
                        ) : (
                          <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className="btn-ghost !p-1.5"
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          strokeWidth={1.75}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2 animate-fade-in">
                      {alert.recommended_action && (
                        <p className="text-xs leading-relaxed text-secondary">
                          <span className="font-medium">Recommended action — </span>
                          {alert.recommended_action}
                        </p>
                      )}
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 pt-1">
                        {[
                          { label: 'Triggered', value: new Date(alert.triggered_at).toLocaleString() },
                          {
                            label: 'Coordinates',
                            value:
                              alert.latitude != null && alert.longitude != null
                                ? `${alert.latitude.toFixed(3)}, ${alert.longitude.toFixed(3)}`
                                : '—',
                          },
                          { label: 'Source', value: alert.data_source === 'simulated' ? 'Simulated' : 'System' },
                          { label: 'Type', value: alert.alert_type.replace('_', ' ') },
                        ].map((row) => (
                          <div key={row.label}>
                            <dt className="kicker mb-0.5">{row.label}</dt>
                            <dd className="text-xs text-secondary">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {alert.latitude != null && alert.longitude != null && (
                        <button
                          onClick={() =>
                            navigate(
                              `/map?lat=${alert.latitude}&lng=${alert.longitude}&name=${encodeURIComponent(alert.location_name ?? '')}`,
                            )
                          }
                          className="link text-xs inline-flex items-center gap-1 mt-1"
                        >
                          View on methane map
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {visible.length === 0 && (
            <li>
              <EmptyState
                icon={Bell}
                title={`No ${filter === 'all' ? '' : `${filter} `}alerts`}
                description="The monitoring network is quiet right now."
              />
            </li>
          )}
        </ul>
      </Panel>
    </div>
  );
}

