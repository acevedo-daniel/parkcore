import { Building2, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoResetControl } from '../../features/auth/demo-reset-control.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { cn } from '../../lib/cn.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { AppearanceControls } from '../ui/appearance-controls.js';

const ownerLinks = [
  { Icon: LayoutDashboard, label: 'Overview', to: '/app' },
  { Icon: Building2, label: 'Parkings', to: '/app/parkings' },
];

function OwnerLink({ Icon, label, to }: (typeof ownerLinks)[number]) {
  return (
    <NavLink
      end={to === '/app'}
      className={({ isActive }) =>
        cn(
          'owner-nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors',
          isActive
            ? 'is-active bg-surface-raised text-foreground font-semibold shadow-xs border-l-2 border-primary'
            : 'text-foreground-secondary hover:text-foreground hover:bg-surface-subtle',
        )
      }
      to={to}
    >
      <Icon aria-hidden="true" size={17} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export function OwnerLayout() {
  const { suggestTheme, t } = useAppearance();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    suggestTheme('dark');
    const interval = window.setInterval(() => {
      setClock(new Date());
    }, 30_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [suggestTheme]);
  useDocumentMeta({
    description: 'Operate ParkCore parking facilities with active sessions, capacity and rates.',
    noIndex: true,
    title: 'ParkCore | Operations',
  });

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };
  return (
    <div className="owner-theme owner-shell min-h-screen flex flex-col md:flex-row bg-canvas text-foreground">
      <a className="skip-link" href="#owner-main">
        Skip to main content
      </a>
      <aside className="owner-sidebar hidden md:flex md:w-64 md:flex-col md:justify-between border-r border-border bg-surface p-6 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="owner-brand-block flex items-center justify-between pb-6 border-b border-border">
            <Link
              aria-label="ParkCore operations"
              className="brand-mark flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
              to="/app"
            >
              <span className="size-2 rounded-full bg-primary ring-4 ring-primary/20" />
              PARKCORE
            </Link>
            <span className="demo-status">{t('demo.live')}</span>
          </div>
          <nav aria-label="Owner navigation" className="owner-navigation flex flex-col gap-1">
            {ownerLinks.map((link) => (
              <OwnerLink key={link.to} {...link} />
            ))}
          </nav>
        </div>
        <div className="owner-account flex flex-col gap-3 pt-6 border-t border-border">
          <div className="owner-utilities flex items-center justify-between">
            <time
              className="system-clock font-mono text-xs text-foreground-muted tabular-nums"
              dateTime={clock.toISOString()}
            >
              {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
                clock,
              )}
            </time>
            <AppearanceControls compact />
          </div>
          <DemoResetControl />
          <NavLink
            className={({ isActive }) =>
              cn(
                'owner-nav-link flex items-center gap-3 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors',
                isActive
                  ? 'is-active bg-surface-raised text-foreground font-semibold'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface-subtle',
              )
            }
            to="/app/profile"
          >
            <UserRound aria-hidden="true" size={16} />
            <span>Profile</span>
          </NavLink>
          <button
            className="owner-nav-link owner-sign-out flex items-center gap-3 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-danger hover:bg-danger-surface transition-colors w-full text-left cursor-pointer"
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <header className="owner-mobile-header md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-surface sticky top-0 z-30">
        <Link
          className="brand-mark flex items-center gap-2 font-display text-base font-bold text-foreground"
          to="/app"
        >
          <span className="size-2 rounded-full bg-primary" />
          PARKCORE
        </Link>
        <div className="flex items-center gap-2">
          <span className="type-label">{t('nav.operations')}</span>
          <button
            aria-label="Sign out"
            className="icon-button size-9 rounded-md border border-border bg-surface-raised flex items-center justify-center text-foreground hover:bg-surface-hover transition-colors"
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
          </button>
        </div>
      </header>
      {navigation.state !== 'idle' ? (
        <div
          aria-live="polite"
          className="route-loading-bar fixed top-0 inset-x-0 h-1 bg-primary animate-pulse z-50"
        >
          Loading route
        </div>
      ) : null}
      <main
        className="owner-main flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8"
        id="owner-main"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <nav
        aria-label="Owner mobile navigation"
        className="owner-mobile-nav md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-border bg-surface/95 backdrop-blur-md z-30 flex items-center justify-around px-4"
      >
        {ownerLinks.map((link) => (
          <OwnerLink key={link.to} {...link} />
        ))}
        <NavLink
          className={({ isActive }) =>
            cn(
              'owner-nav-link flex flex-col items-center gap-1 text-xs font-medium transition-colors',
              isActive
                ? 'is-active text-primary font-semibold'
                : 'text-foreground-secondary hover:text-foreground',
            )
          }
          to="/app/profile"
        >
          <UserRound aria-hidden="true" size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
