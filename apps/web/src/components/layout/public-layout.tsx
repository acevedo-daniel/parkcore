import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigation } from 'react-router';

import { cn } from '../../lib/cn.js';

const publicLinks = [
  { label: 'Parkings', to: '/parkings' },
  { label: 'Sign in', to: '/login' },
];

function PublicLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {publicLinks.map((link) => (
        <NavLink
          key={link.to}
          className={({ isActive }) => cn('public-nav-link', isActive && 'is-active')}
          to={link.to}
          onClick={onNavigate}
        >
          {link.label}
        </NavLink>
      ))}
      <Link className="public-get-started" to="/register" onClick={onNavigate}>
        Get started
      </Link>
    </>
  );
}

function PublicMobileMenu() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label="Open navigation"
          className="icon-button public-menu-trigger"
          type="button"
        >
          <Menu aria-hidden="true" size={19} />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="public-menu-overlay" />
        <DialogPrimitive.Content className="public-menu-content">
          <header className="public-menu-header">
            <DialogPrimitive.Title className="brand-mark">PARKCORE</DialogPrimitive.Title>
            <DialogPrimitive.Description className="visually-hidden">
              Public navigation
            </DialogPrimitive.Description>
            <DialogPrimitive.Close asChild>
              <button aria-label="Close navigation" className="icon-button" type="button">
                <X aria-hidden="true" size={18} />
              </button>
            </DialogPrimitive.Close>
          </header>
          <nav aria-label="Public navigation" className="public-mobile-links">
            <DialogPrimitive.Close asChild>
              <Link to="/parkings">Parkings</Link>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Link to="/login">Sign in</Link>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Link className="public-get-started" to="/register">
                Get started
              </Link>
            </DialogPrimitive.Close>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function PublicLayout() {
  const navigation = useNavigation();
  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header-inner">
          <Link aria-label="ParkCore home" className="brand-mark" to="/">
            PARKCORE
          </Link>
          <nav aria-label="Public navigation" className="public-desktop-nav">
            <PublicLinks />
          </nav>
          <div className="public-mobile-nav">
            <PublicMobileMenu />
          </div>
        </div>
      </header>
      {navigation.state !== 'idle' ? (
        <div aria-live="polite" className="route-loading-bar">
          Loading route
        </div>
      ) : null}
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}
