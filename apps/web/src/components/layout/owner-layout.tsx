import { Building2, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  type NavLinkRenderProps,
  useNavigate,
  useNavigation,
} from 'react-router';

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
      className={({ isActive }: NavLinkRenderProps) =>
        cn(
          compact
            ? 'owner-nav-link flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors'
            : 'owner-nav-link flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'is-active bg-primary text-primary-foreground font-semibold'
            : 'text-foreground-secondary hover:bg-surface-subtle hover:text-foreground',
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
  const { locale, t } = useAppearance();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [clock, setClock] = useState(() => new Date());
  const ownerLinks = [
    { Icon: LayoutDashboard, label: t('nav.overview'), to: '/app' },
    { Icon: Building2, label: t('nav.parkings'), to: '/app/parkings' },
  ];
  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(new Date());
    }, 30_000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);
  useDocumentMeta({
    description: t('shell.ownerMetaDescription'),
    noIndex: true,
    title: t('shell.ownerMetaTitle'),
  });

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };
  return (
    <div className="owner-theme owner-shell flex min-h-screen flex-col bg-canvas text-foreground md:flex-row">
      <a className="skip-link" href="#owner-main">
        {t('nav.skipMain')}
      </a>
      <aside className="owner-sidebar hidden shrink-0 border-r border-border-strong bg-surface p-6 md:flex md:w-64 md:flex-col md:justify-between">
        <div className="flex flex-col gap-6">
          <div className="owner-brand-block border-b border-border-strong pb-5">
            <Link
              aria-label={t('shell.ownerHome')}
              className="brand-mark font-display text-lg font-bold tracking-[-0.035em] text-foreground transition-colors hover:text-foreground-secondary"
              to="/app"
            >
              PARKCORE
            </Link>
          </div>
          <nav aria-label={t('nav.owner')} className="owner-navigation flex flex-col gap-1">
            {ownerLinks.map((link) => (
              <OwnerLink key={link.to} {...link} />
            ))}
          </nav>
        </div>
        <div className="owner-account flex flex-col gap-4 border-t border-border-strong pt-5">
          <div className="flex items-center justify-between">
            <time
              className="system-clock font-mono text-xs text-foreground-muted tabular-nums"
              dateTime={clock.toISOString()}
            >
              {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
                clock,
              )}
            </time>
          </div>
          <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-subtle p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
              {t('nav.preferences')}
            </p>
            <AppearanceControls compact />
          </section>
          <section className="border-t border-border-subtle pt-3">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
              {t('nav.account')}
            </p>
            <NavLink
              className={({ isActive }: NavLinkRenderProps) =>
                cn(
                  'owner-nav-link flex items-center gap-3 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors',
                  isActive
                    ? 'is-active bg-primary text-primary-foreground font-semibold'
                    : 'text-foreground-secondary hover:bg-surface-subtle hover:text-foreground',
                )
              }
              to="/app/profile"
            >
              <UserRound aria-hidden="true" size={16} />
              <span>{t('nav.profile')}</span>
            </NavLink>
            <button
              className="owner-nav-link owner-sign-out flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-subtle hover:text-foreground"
              onClick={signOut}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              <span>{t('nav.signOut')}</span>
            </button>
          </section>
          {user?.kind === 'DEMO' ? (
            <div className="border-t border-border-subtle pt-3">
              <DemoResetControl />
            </div>
          ) : null}
        </div>
      </aside>
      <header className="owner-mobile-header sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-strong bg-surface px-4 md:hidden">
        <Link
          className="brand-mark font-display text-base font-bold tracking-[-0.035em] text-foreground"
          to="/app"
        >
          PARKCORE
        </Link>
        <div className="flex items-center gap-2">
          <span className="type-label">{t('nav.operations')}</span>
          <button
            aria-label={t('nav.signOut')}
            className="icon-button flex size-9 items-center justify-center rounded-md border border-border-strong bg-surface text-foreground transition-colors hover:bg-surface-hover"
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
          className="route-loading-bar fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-primary"
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
        className="owner-mobile-nav fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border-strong bg-surface/95 px-4 backdrop-blur-md md:hidden"
      >
        {ownerLinks.map((link) => (
          <OwnerLink compact key={link.to} {...link} />
        ))}
        <NavLink
          className={({ isActive }: NavLinkRenderProps) =>
            cn(
              'owner-nav-link flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'is-active text-foreground font-semibold'
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
