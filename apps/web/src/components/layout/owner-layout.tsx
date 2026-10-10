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
import { useAuth } from '../../features/auth/use-auth.js';
import { cn } from '../../lib/cn.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { AppearanceControls } from '../domain/appearance-controls.js';
import { Button } from '../ui/button.js';

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
            ? 'owner-nav-link flex min-h-11 min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-2xs font-medium transition-colors'
            : 'owner-nav-link flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'is-active bg-primary text-primary-foreground font-semibold'
            : 'text-foreground-secondary hover:bg-muted hover:text-foreground',
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
    { Icon: LayoutDashboard, label: t('nav.home'), to: '/app' },
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
    <div className="owner-theme owner-shell flex min-h-screen flex-col bg-background text-foreground wide:flex-row">
      <a className="skip-link" href="#owner-main">
        {t('nav.skipMain')}
      </a>
      <aside className="owner-sidebar hidden shrink-0 border-r border-border-strong bg-card p-6 wide:sticky wide:top-0 wide:flex wide:h-screen wide:w-60 wide:flex-col wide:justify-between">
        <div className="flex flex-col gap-6">
          <div className="owner-brand-block border-b border-border-strong pb-5">
            <Link
              aria-label={t('shell.ownerHome')}
              className="brand-mark inline-flex min-h-11 items-center font-display text-lg font-bold tracking-title text-foreground transition-colors hover:text-foreground-secondary"
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
              className="system-clock type-operational text-xs text-muted-foreground"
              dateTime={clock.toISOString()}
            >
              {new Intl.DateTimeFormat(locale, {
                hour: '2-digit',
                minute: '2-digit',
                ...(user?.timezone ? { timeZone: user.timezone } : {}),
              }).format(clock)}
            </time>
          </div>
          <section>
            <p className="mb-2 text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
              {t('nav.preferences')}
            </p>
            <AppearanceControls compact layout="stacked" />
          </section>
          <section className="border-t border-border-subtle pt-3">
            <p className="mb-1 px-1 text-2xs font-bold uppercase tracking-eyebrow text-muted-foreground">
              {t('nav.account')}
            </p>
            <NavLink
              className={({ isActive }: NavLinkRenderProps) =>
                cn(
                  'owner-nav-link flex min-h-11 items-center gap-3 px-3.5 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'is-active bg-primary text-primary-foreground font-semibold'
                    : 'text-foreground-secondary hover:bg-muted hover:text-foreground',
                )
              }
              to="/app/profile"
            >
              <UserRound aria-hidden="true" size={16} />
              <span>{t('nav.profile')}</span>
            </NavLink>
            <Button
              className="owner-nav-link owner-sign-out w-full justify-start px-3.5 text-left text-foreground-secondary"
              onClick={signOut}
              type="button"
              variant="ghost"
            >
              <LogOut aria-hidden="true" size={16} />
              <span>{t('nav.signOut')}</span>
            </Button>
          </section>
        </div>
      </aside>
      <header className="owner-mobile-header sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-1 border-b border-border-strong bg-card px-3 pb-2 pt-safe-header wide:hidden">
        <Link
          className="brand-mark flex min-h-11 items-center font-display text-base font-bold tracking-title text-foreground"
          to="/app"
        >
          PARKCORE
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <AppearanceControls className="gap-1" />
          <span className="type-label hidden sm:inline">{t('nav.operations')}</span>
          <Button
            aria-label={t('nav.signOut')}
            size="icon-sm"
            onClick={signOut}
            type="button"
            variant="outline"
          >
            <LogOut aria-hidden="true" size={16} />
          </Button>
        </div>
      </header>
      {navigation.state !== 'idle' ? (
        <div
          aria-live="polite"
          className="route-loading-bar fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-primary"
          role="status"
        >
          <span className="sr-only">{t('route.loading')}</span>
        </div>
      ) : null}
      <main
        className="owner-main mx-auto w-full max-w-owner flex-1 p-5 pb-safe-owner-content sm:px-7 sm:pt-7 sm:pb-safe-owner-content lg:px-10 lg:pt-10 lg:pb-safe-owner-content wide:pb-10"
        id="owner-main"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <nav
        aria-label={t('nav.ownerMobile')}
        className="owner-mobile-nav fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border-strong bg-card/95 px-4 backdrop-blur-md wide:hidden"
      >
        {ownerLinks.map((link) => (
          <OwnerLink compact key={link.to} {...link} />
        ))}
        <NavLink
          className={({ isActive }: NavLinkRenderProps) =>
            cn(
              'owner-nav-link flex min-h-11 min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-2xs font-medium transition-colors',
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
