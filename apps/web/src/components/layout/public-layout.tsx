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
import { AppearanceControls } from '../domain/appearance-controls.js';
import { BrandMark } from '../domain/brand-mark.js';
import { Button } from '../ui/button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog.js';

const publicNavLinkBase =
  'public-nav-link min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors';
const publicNavLinkActive = 'is-active bg-muted text-foreground';
const publicNavLinkIdle = 'text-foreground-secondary hover:bg-muted hover:text-foreground';
const publicMobileLinkBase =
  'flex min-h-11 items-center rounded-lg px-4 py-3 text-base font-bold transition-colors';
const publicMobileNavLinkClass = cn(
  publicMobileLinkBase,
  publicNavLinkIdle,
  'aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
);

function PublicLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useAppearance();
  return (
    <div className="flex items-center gap-1.5">
      <NavLink
        className={({ isActive }: NavLinkRenderProps) =>
          cn(publicNavLinkBase, 'flex', isActive ? publicNavLinkActive : publicNavLinkIdle)
        }
        to="/parkings"
        onClick={onNavigate}
      >
        {t('nav.parkings')}
      </NavLink>
      <Link
        className={cn(publicNavLinkBase, 'flex', publicNavLinkIdle)}
        to="/#como-funciona"
        onClick={onNavigate}
      >
        {t('nav.howItWorks')}
      </Link>
    </div>
  );
}

function PublicMobileMenu() {
  const { t } = useAppearance();
  const navigate = useNavigate();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={t('nav.open')}
          className="public-menu-trigger"
          shape="pill"
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Menu aria-hidden="true" size={20} />
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="public-menu-overlay backdrop-blur-xs animate-in fade-in" />
        <DialogContent className="public-menu-content fixed inset-y-0 left-auto right-0 top-0 z-50 mx-0 flex h-dvh w-full max-w-xs translate-y-0 flex-col justify-between overflow-x-hidden overflow-y-auto rounded-l-xl border-l border-border bg-card p-6 pb-safe-overlay pt-safe-overlay shadow-xl animate-in fade-in">
          <div>
            <header className="public-menu-header mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
              <DialogTitle className="brand-mark flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-foreground">
                <BrandMark className="size-7" />
                PARKCORE
              </DialogTitle>
              <DialogDescription className="sr-only">{t('nav.public')}</DialogDescription>
              <DialogClose asChild>
                <Button
                  aria-label={t('nav.close')}
                  shape="pill"
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <X aria-hidden="true" size={18} />
                </Button>
              </DialogClose>
            </header>

            <nav aria-label={t('nav.public')} className="public-mobile-links flex flex-col gap-2">
              <DialogClose asChild>
                <NavLink className={publicMobileNavLinkClass} to="/parkings">
                  {t('nav.parkings')}
                </NavLink>
              </DialogClose>
              <DialogClose asChild>
                <Link className={cn(publicMobileLinkBase, publicNavLinkIdle)} to="/#como-funciona">
                  {t('nav.howItWorks')}
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <NavLink className={publicMobileNavLinkClass} to="/login">
                  {t('nav.signIn')}
                </NavLink>
              </DialogClose>
            </nav>
          </div>

          <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
            <DemoLoginButton
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
              className="w-full"
              shape="pill"
              variant="default"
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-foreground-secondary">
                {t('appearance.languageTheme')}
              </span>
              <AppearanceControls compact />
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export function PublicLayout() {
  const { t } = useAppearance();
  const navigate = useNavigate();
  const navigation = useNavigation();
  return (
    <div className="public-shell flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-brand selection:text-brand-foreground">
      <a className="skip-link" href="#public-main">
        {t('nav.skipMain')}
      </a>

      <header className="public-header sticky top-0 z-40 w-full border-b border-border-subtle bg-card/90 backdrop-blur-md transition-colors">
        <div className="public-header-inner mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          {/* Brand mark */}
          <div className="flex items-center gap-10">
            <Link
              aria-label={t('shell.publicHome')}
              className="brand-mark group flex min-h-11 items-center gap-2.5 font-display text-xl font-black tracking-tight text-foreground sm:text-2xl"
              to="/"
            >
              <BrandMark className="size-8 transition-control motion-safe:group-hover:-rotate-6 sm:size-9" />
              <span>PARKCORE</span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label={t('nav.public')}
              className="public-desktop-nav hidden wide:flex items-center"
            >
              <PublicLinks />
            </nav>
          </div>

          {/* Right actions: language, appearance, sign in, and demo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="public-header-tools hidden wide:flex items-center">
              <AppearanceControls />
            </div>

            <NavLink
              className={({ isActive }: NavLinkRenderProps) =>
                cn(
                  publicNavLinkBase,
                  'hidden wide:inline-flex',
                  isActive ? publicNavLinkActive : publicNavLinkIdle,
                )
              }
              to="/login"
            >
              {t('nav.signIn')}
            </NavLink>

            <DemoLoginButton
              onSuccess={() => {
                void navigate('/app', { replace: true });
              }}
              shape="pill"
              variant="default"
              wrapperClassName="hidden wide:flex"
            />

            <div className="public-mobile-nav wide:hidden">
              <PublicMobileMenu />
            </div>
          </div>
        </div>
      </header>

      {navigation.state !== 'idle' ? (
        <div
          aria-live="polite"
          className="route-loading-bar fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-brand"
          role="status"
        >
          <span className="sr-only">{t('route.loading')}</span>
        </div>
      ) : null}

      <main className="public-main flex-1 w-full" id="public-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
