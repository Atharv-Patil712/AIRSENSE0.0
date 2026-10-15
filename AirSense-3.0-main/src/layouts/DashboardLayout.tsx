import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, MapPin, LogOut, ChevronDown, Sun, Moon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { navGroups } from '@/config/navigation';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { kbdLabel } from '@/lib/platform';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { AirSenseLogo } from '@/components/brand/AirSenseMark';

export function DashboardLayout() {
  const { user, profile, signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dashboard-shell min-h-screen bg-[var(--color-bg)] flex relative overflow-x-hidden selection:bg-sky-500/20">
      {/* Ambient decorative atmosphere glows */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[520px] h-[520px] bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none fixed top-1/3 -left-40 w-[480px] h-[480px] bg-emerald-400/8 dark:bg-emerald-500/10 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none fixed -bottom-40 right-1/4 w-[420px] h-[420px] bg-indigo-400/8 dark:bg-indigo-500/10 rounded-full blur-3xl z-0" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] backdrop-blur-xl bg-[var(--color-surface)]/90 border-r border-[var(--color-border)]/80 transform transition-transform duration-300 ease-out lg:translate-x-0 shadow-lg lg:shadow-none flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--color-border)]/70">
          <div className="flex items-center gap-2">
            <AirSenseLogo size="sm" />
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              v3.0
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="kicker px-3 mb-2 text-[10.5px] font-bold tracking-wider text-muted/80">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-sky-500/15 via-sky-500/10 to-transparent text-[var(--color-primary-text)] font-semibold shadow-sm'
                              : 'text-secondary hover:bg-[var(--color-surface-2)]/80 hover:text-[var(--color-text)] hover:translate-x-1'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full bg-gradient-to-b from-sky-400 to-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                            )}
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                                isActive ? 'text-sky-500 scale-105' : 'text-muted group-hover:text-[var(--color-text)]'
                              }`}
                              strokeWidth={isActive ? 2.2 : 1.75}
                            />
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Quick status pill at bottom of sidebar */}
        <div className="p-4 border-t border-[var(--color-border)]/60">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-border)]/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-secondary font-medium truncate">Telemetry Active</span>
            <span className="ml-auto text-[10px] text-muted font-mono">LIVE</span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden animate-overlay-in backdrop-blur-sm"
          style={{ background: 'var(--overlay)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col relative z-10">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-20 backdrop-blur-md bg-[var(--color-surface)]/85 border-b border-[var(--color-border)]/80 flex items-center px-4 sm:px-6 gap-3 transition-colors duration-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-secondary" strokeWidth={1.75} />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 w-full max-w-sm min-w-0 h-9 px-3 rounded-xl border border-[var(--color-border-strong)]/70 bg-[var(--color-surface-2)]/40 hover:bg-[var(--color-surface-2)]/80 text-left transition-all duration-200 hover:border-sky-500/40 shadow-sm"
            aria-label={`Open search (${kbdLabel})`}
          >
            <Search className="w-3.5 h-3.5 text-muted flex-shrink-0" strokeWidth={1.75} />
            <span className="text-[13px] text-muted truncate flex-1">Search stations, hotspots, metrics…</span>
            <kbd className="mono-label text-[11px] uppercase text-muted bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-1.5 py-0.5 hidden sm:block shadow-xs">
              {kbdLabel}
            </kbd>
          </button>

          <div className="flex-1" />

          {/* Live telemetry badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">Live Telemetry</span>
            <span className="text-[10px] text-muted font-mono ml-0.5">• 40 Cities</span>
          </div>

          {/* Region */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-secondary font-medium px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
            <MapPin className="w-3.5 h-3.5 text-sky-500" strokeWidth={1.75} />
            India
          </div>

          <div className="w-px h-5 bg-[var(--color-border)] hidden md:block" />

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="btn-ghost !p-2 rounded-xl hover:scale-105 active:scale-95 transition-all text-secondary hover:text-[var(--color-text)]"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-once" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            )}
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile Menu */}
          <div data-profile-menu className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] transition-all duration-200"
              aria-expanded={showProfile}
              aria-label="Account menu"
            >
              <span className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-sm">
                {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium text-[var(--color-text)] hidden sm:inline max-w-[100px] truncate">
                {profile?.full_name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                  showProfile ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-60 surface shadow-popover z-50 p-1.5 animate-fade-in rounded-2xl border border-[var(--color-border)]">
                <div className="px-3.5 py-3 border-b border-[var(--color-border)]/70">
                  <p className="text-[13px] font-semibold text-[var(--color-text)]">{profile?.full_name || 'AirSense User'}</p>
                  <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <NavLink
                    to="/settings"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-2)] text-[13px] text-secondary hover:text-[var(--color-text)] font-medium transition-colors"
                  >
                    Settings & Preferences
                  </NavLink>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-[13px] text-rose-600 dark:text-rose-400 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      {/* Global command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
