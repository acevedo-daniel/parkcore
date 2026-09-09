import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { cn } from '../../lib/cn.js';
import { AppearanceControls } from '../ui/appearance-controls.js';

const publicLinks = [
  { label: 'Parkings', to: '/parkings' },
  { label: 'Sign in', to: '/login' },
];

function PublicLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {publicLinks.map((link) => (
        <NavLink
          key={link.to}
          className={({ isActive }) =>
            cn(
              'public-nav-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'is-active bg-surface-hover text-foreground font-semibold shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-subtle',
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
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label="Open navigation"
          className="icon-button public-menu-trigger size-10 rounded-md border border-border bg-surface flex items-center justify-center text-foreground hover:bg-surface-hover transition-colors"
          type="button"
        >
          <Menu aria-hidden="true" size={19} />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="public-menu-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
        <DialogPrimitive.Content className="public-menu-content fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-surface border-l border-border p-6 shadow-dialog flex flex-col gap-6">
          <header className="public-menu-header flex items-center justify-between border-b border-border pb-4">
            <DialogPrimitive.Title className="brand-mark font-display text-lg font-bold tracking-wider text-foreground">
              PARKCORE
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="visually-hidden">
              Public navigation
            </DialogPrimitive.Description>
            <DialogPrimitive.Close asChild>
              <button
                aria-label="Close navigation"
                className="icon-button size-9 rounded-md border border-border bg-surface-raised flex items-center justify-center text-foreground hover:bg-surface-hover transition-colors"
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </DialogPrimitive.Close>
          </header>
          <nav aria-label="Public navigation" className="public-mobile-links flex flex-col gap-3">
            <DialogPrimitive.Close asChild>
              <Link
                className="px-3 py-2 rounded-md text-base font-semibold text-foreground hover:bg-surface-subtle transition-colors"
                to="/parkings"
              >
                Parkings
              </Link>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Link
                className="px-3 py-2 rounded-md text-base font-semibold text-foreground hover:bg-surface-subtle transition-colors"
                to="/login"
              >
                Sign in
              </Link>
            </DialogPrimitive.Close>
            <div className="pt-4 border-t border-border flex flex-col gap-4">
              <AppearanceControls compact />
              <div>
                <span className="demo-status">{t('demo.live')}</span>
              </div>
            </div>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function PublicLayout() {
  const { suggestTheme, t } = useAppearance();
  const navigate = useNavigate();
  const navigation = useNavigation();
  useEffect(() => {
    suggestTheme('light');
  }, [suggestTheme]);
  return (
    <div className="public-shell min-h-screen flex flex-col bg-canvas text-foreground">
      <a className="skip-link" href="#public-main">
        Skip to main content
      </a>
      <header className="public-header sticky top-0 z-40 w-full border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="demo-flight-deck border-b border-border-subtle bg-surface-subtle/80 py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="demo-flight-deck-inner max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="demo-status">{t('demo.live')}</span>
              <span className="type-small demo-disclosure text-foreground-muted hidden sm:inline font-mono">
                Canonical operational data
              </span>
            </div>
            <DemoLoginButton
              onSuccess={() => void navigate('/app', { replace: true })}
              variant="primary"
            />
          </div>
        </div>
        <div className="public-header-inner max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              aria-label="ParkCore home"
              className="brand-mark flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
              to="/"
            >
              <span className="size-2 rounded-full bg-primary ring-4 ring-primary/20" />
              PARKCORE
            </Link>
            <nav
              aria-label="Public navigation"
              className="public-desktop-nav hidden md:flex items-center"
            >
              <PublicLinks />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="public-header-tools hidden sm:flex items-center">
              <AppearanceControls />
            </div>
            <div className="public-mobile-nav md:hidden">
              <PublicMobileMenu />
            </div>
          </div>
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
      <main className="public-main flex-1 w-full" id="public-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
