import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { alertService } from '@/services/alertService';
import { SEVERITY_COLORS } from '@/data/indiaData';
import { timeAgo } from '@/lib/format';
import type { EnvironmentalAlert } from '@/types';

/**
 * Notification center — live unread state over the alert feed,
 * mark-all-read (persisted for real records, optimistic for simulated),
 * and a shortcut into the full alert center.
 */
export function NotificationCenter() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    alertService.getAlerts().then((res) => {
      if (mounted) setAlerts(res.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const markAllRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    // Persist only real (non-simulated) records; demo alerts stay client-side.
    const persistable = alerts.filter((a) => !a.is_read && !a.id.startsWith('demo-'));
    await Promise.allSettled(persistable.map((a) => alertService.markAsRead(a.id)));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost relative !p-2"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 grid place-items-center rounded-full bg-danger-500 text-white text-[9px] font-semibold tnum">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[340px] max-w-[calc(100vw-2rem)] surface shadow-popover z-50 animate-fade-in">
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div>
              <p className="text-[13px] font-semibold tracking-tight">Notifications</p>
              <p className="mono-label uppercase text-muted mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="btn-ghost !text-xs gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark read
              </button>
            )}
          </header>

          <ul className="max-h-[320px] overflow-y-auto scrollbar-thin divide-rule">
            {alerts.slice(0, 6).map((alert) => (
              <li key={alert.id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/alerts');
                  }}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span
                    className="status-dot mt-[7px]"
                    style={{ backgroundColor: SEVERITY_COLORS[alert.severity], opacity: alert.is_read ? 0.35 : 1 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] truncate ${alert.is_read ? 'text-secondary' : 'font-medium'}`}>
                      {alert.location_name}
                    </span>
                    <span className="block text-[11.5px] text-muted line-clamp-1 mt-px">{alert.reason}</span>
                    <span className="block mono-label uppercase text-muted mt-1">{timeAgo(alert.triggered_at)}</span>
                  </span>
                  {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />}
                </button>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted">No notifications yet</li>
            )}
          </ul>

          <footer className="border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/alerts');
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-secondary hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Open alert center
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
