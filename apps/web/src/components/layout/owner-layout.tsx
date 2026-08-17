import { Building2, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';

import { useAuth } from '../../features/auth/use-auth.js';
import { cn } from '../../lib/cn.js';

const ownerLinks = [
  { Icon: LayoutDashboard, label: 'Overview', to: '/app' },
  { Icon: Building2, label: 'Parkings', to: '/app/parkings' },
];

function OwnerLink({ Icon, label, to }: (typeof ownerLinks)[number]) {
  return (
    <NavLink
      end={to === '/app'}
      className={({ isActive }) => cn('owner-nav-link', isActive && 'is-active')}
      to={to}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

export function OwnerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const signOut = () => {
    logout();
    void navigate('/login', { replace: true });
  };
  return (
    <div className="owner-theme owner-shell">
      <aside className="owner-sidebar">
        <Link aria-label="ParkCore operations" className="brand-mark" to="/app">
          PARKCORE
        </Link>
        <nav aria-label="Owner navigation" className="owner-navigation">
          {ownerLinks.map((link) => (
            <OwnerLink key={link.to} {...link} />
          ))}
        </nav>
        <div className="owner-account">
          <NavLink
            className={({ isActive }) => cn('owner-nav-link', isActive && 'is-active')}
            to="/app/profile"
          >
            <UserRound aria-hidden="true" size={16} />
            <span>Profile</span>
          </NavLink>
          <button className="owner-nav-link owner-sign-out" onClick={signOut} type="button">
            <LogOut aria-hidden="true" size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <header className="owner-mobile-header">
        <Link className="brand-mark" to="/app">
          PARKCORE
        </Link>
        <span className="type-label">Operations</span>
        <button aria-label="Sign out" className="icon-button" onClick={signOut} type="button">
          <LogOut aria-hidden="true" size={17} />
        </button>
      </header>
      {navigation.state !== 'idle' ? (
        <div aria-live="polite" className="route-loading-bar">
          Loading route
        </div>
      ) : null}
      <main className="owner-main">
        <Outlet />
      </main>
      <nav aria-label="Owner mobile navigation" className="owner-mobile-nav">
        {ownerLinks.map((link) => (
          <OwnerLink key={link.to} {...link} />
        ))}
        <NavLink
          className={({ isActive }) => cn('owner-nav-link', isActive && 'is-active')}
          to="/app/profile"
        >
          <UserRound aria-hidden="true" size={16} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
