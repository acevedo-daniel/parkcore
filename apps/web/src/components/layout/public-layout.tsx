import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import {
  Link,
  NavLink,
  Outlet,
  type NavLinkRenderProps,
  useNavigate,
  useNavigation,
} from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { cn } from '../../lib/cn.js';
import { AppearanceControls } from '../ui/appearance-controls.js';

function PublicLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useAppearance();
  const publicLinks = [
    { label: t('nav.parkings'), to: '/parkings' },
    { label: t('nav.signIn'), to: '/login' },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {publicLinks.map((link) => (
        <NavLink
          key={link.to}
          className={({ isActive }: NavLinkRenderProps) =>
            cn(
              'public-nav-link rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px',
              isActive
                ? 'is-active bg-surface-subtle text-foreground'
                : 'text-foreground-secondary hover:bg-surface-subtle hover:text-foreground',
            )
          }
          to={link.to}
          onClick={onNavigate}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

function PublicMobileMenu() {
  const { t } = useAppearance();
  const navigate = useNavigate();
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label={t('nav.open')}
          className="icon-button public-menu-trigger flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-accent"
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="public-menu-overlay fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-xs animate-in fade-in" />
        <DialogPrimitive.Content className="public-menu-content fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col justify-between border-l border-border bg-surface p-6 shadow-dialog animate-in slide-in-from-right">
          <div>
            <header className="public-menu-header mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
              <DialogPrimitive.Title className="brand-mark font-display text-lg font-extrabold tracking-tight text-foreground">
                PARKCORE
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="visually-hidden">
                {t('nav.public')}
              </DialogPrimitive.Description>
              <DialogPrimitive.Close asChild>
                <button
                  aria-label={t('nav.close')}
                  className="icon-button flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-accent"
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </DialogPrimitive.Close>
            </header>

            <nav aria-label={t('nav.public')} className="public-mobile-links flex flex-col gap-2">
              <DialogPrimitive.Close asChild>
                <Link
                  className="rounded-[var(--radius-md)] px-4 py-3 text-base font-bold text-foreground transition-colors hover:bg-surface-subtle"
                  to="/parkings"
                >
                  {t('nav.parkings')}
                </Link>
              </DialogPrimitive.Close>
              <DialogPrimitive.Close asChild>
                <Link
                  className="rounded-[var(--radius-md)] px-4 py-3 text-base font-bold text-foreground transition-colors hover:bg-surface-subtle"
                  to="/login"
                >
                  {t('nav.signIn')}
                </Link>
              </DialogPrimitive.Close>
            </nav>
          </div>

          <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-secondary">
                {t('appearance.languageTheme')}
              </span>
              <AppearanceControls compact />
            </div>
            <div className="pt-2">
              <DemoLoginButton
                onSuccess={() => {
                  void navigate('/app', { replace: true });
                }}
                className="block w-full rounded-full bg-primary py-3 text-center text-xs font-bold text-primary-foreground"
              />
            </div>
            <div className="flex items-center justify-center">
              <span className="demo-status font-mono text-[11px]">{t('demo.live')}</span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function PublicLayout() {
  const { t } = useAppearance();
  const navigate = useNavigate();
  const navigation = useNavigation();
  return (
    <div className="public-shell flex min-h-screen flex-col bg-canvas font-sans text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      <a className="skip-link" href="#public-main">
        {t('nav.skipMain')}
      </a>

      {/* Unified, sleek, Wise-standard navbar */}
      <header className="public-header sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-all">
        <div className="public-header-inner mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          {/* Brand mark */}
          <div className="flex items-center gap-10">
            <Link
              aria-label={t('shell.publicHome')}
              className="brand-mark group flex items-center gap-2 font-display text-xl font-black tracking-tight text-foreground sm:text-2xl"
              to="/"
            >
              <span>PARKCORE</span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label={t('nav.public')}
              className="public-desktop-nav hidden md:flex items-center"
            >
              <PublicLinks />
            </nav>
          </div>

          {/* Right actions: Language, Sign in, Operator Demo pill button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="public-header-tools hidden sm:flex items-center">
              <AppearanceControls />
            </div>

            <DemoLoginButton
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
              className="hidden rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex"
            />

            <div className="public-mobile-nav md:hidden">
              <PublicMobileMenu />
            </div>
          </div>
        </div>
      </header>

      {navigation.state !== 'idle' ? (
        <div
          aria-live="polite"
          className="route-loading-bar fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-accent"
          role="status"
        >
          <span className="visually-hidden">{t('route.loading')}</span>
        </div>
      ) : null}

      <main className="public-main flex-1 w-full" id="public-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
