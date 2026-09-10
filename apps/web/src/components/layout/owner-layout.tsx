import { Building2, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoResetControl } from '../../features/auth/demo-reset-control.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { cn } from '../../lib/cn.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { AppearanceControls } from '../ui/appearance-controls.js';

function OwnerLink({
  compact = false,
  Icon,
  label,
  to,
}: {
  compact?: boolean;
  Icon: typeof LayoutDashboard;
  label: string;
  to: string;
}) {
  return (
    <NavLink
      end={to === '/app'}
      className={({ isActive }) =>
        cn(
          compact
            ? 'owner-nav-link flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors'
            : 'owner-nav-link flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'is-active bg-[#121417] text-white font-semibold'
            : 'text-foreground-secondary hover:text-foreground hover:bg-[#f1eee7]',
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
  const { language, suggestTheme, t } = useAppearance();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [clock, setClock] = useState(() => new Date());
  const ownerLinks = [
    { Icon: LayoutDashboard, label: t('nav.overview'), to: '/app' },
    { Icon: Building2, label: t('nav.parkings'), to: '/app/parkings' },
  ];
  useEffect(() => {
    suggestTheme('light');
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
        {t('nav.skipMain')}
      </a>
      <aside className="owner-sidebar hidden md:flex md:w-64 md:flex-col md:justify-between border-r border-[#121417] bg-white p-6 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="owner-brand-block flex flex-col items-start gap-3 border-b border-[#121417] pb-5">
            <Link
              aria-label="ParkCore operations"
              className="brand-mark font-display text-lg font-bold tracking-[-0.035em] text-[#121417] transition-colors hover:text-[#45423c]"
              to="/app"
            >
              PARKCORE
            </Link>
            <span className="demo-status">{t('demo.live')}</span>
          </div>
          <nav aria-label={t('nav.owner')} className="owner-navigation flex flex-col gap-1">
            {ownerLinks.map((link) => (
              <OwnerLink key={link.to} {...link} />
            ))}
          </nav>
        </div>
        <div className="owner-account flex flex-col gap-4 border-t border-[#121417] pt-5">
          <div className="flex items-center justify-between">
            <time
              className="system-clock font-mono text-xs text-foreground-muted tabular-nums"
              dateTime={clock.toISOString()}
            >
              {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
                clock,
              )}
            </time>
          </div>
          <section className="rounded-[var(--radius-sm)] border border-[#121417]/10 bg-[#f5f5f5] p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d695f]">
              {language === 'es' ? 'Preferencias' : 'Preferences'}
            </p>
            <AppearanceControls compact />
          </section>
          <section className="border-t border-[#121417]/10 pt-3">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d695f]">
              {language === 'es' ? 'Cuenta' : 'Account'}
            </p>
            <NavLink
              className={({ isActive }) =>
                cn(
                  'owner-nav-link flex items-center gap-3 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors',
                  isActive
                    ? 'is-active bg-[#121417] text-white font-semibold'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-[#f1eee7]',
                )
              }
              to="/app/profile"
            >
              <UserRound aria-hidden="true" size={16} />
              <span>{t('nav.profile')}</span>
            </NavLink>
            <button
              className="owner-nav-link owner-sign-out flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-[#f1eee7] hover:text-foreground"
              onClick={signOut}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              <span>{t('nav.signOut')}</span>
            </button>
          </section>
          <div className="border-t border-[#121417]/10 pt-3">
            <DemoResetControl />
          </div>
        </div>
      </aside>
      <header className="owner-mobile-header md:hidden flex items-center justify-between h-14 px-4 border-b border-[#121417] bg-white sticky top-0 z-30">
        <Link
          className="brand-mark font-display text-base font-bold tracking-[-0.035em] text-[#121417]"
          to="/app"
        >
          PARKCORE
        </Link>
        <div className="flex items-center gap-2">
          <span className="type-label">{t('nav.operations')}</span>
          <button
            aria-label={t('nav.signOut')}
            className="icon-button size-9 rounded-md border border-[#121417] bg-white flex items-center justify-center text-[#121417] hover:bg-[#f1eee7] transition-colors"
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
          role="status"
        >
          <span className="visually-hidden">{t('route.loading')}</span>
        </div>
      ) : null}
      <main
        className="owner-main flex-1 p-5 sm:p-7 lg:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-10"
        id="owner-main"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <nav
        aria-label={t('nav.ownerMobile')}
        className="owner-mobile-nav md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-[#121417] bg-white/95 backdrop-blur-md z-30 flex items-center justify-around px-4"
      >
        {ownerLinks.map((link) => (
          <OwnerLink compact key={link.to} {...link} />
        ))}
        <NavLink
          className={({ isActive }) =>
            cn(
              'owner-nav-link flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'is-active text-[#121417] font-semibold'
                : 'text-foreground-secondary hover:text-foreground',
            )
          }
          to="/app/profile"
        >
          <UserRound aria-hidden="true" size={18} />
          <span>{t('nav.profile')}</span>
        </NavLink>
      </nav>
    </div>
  );
}
