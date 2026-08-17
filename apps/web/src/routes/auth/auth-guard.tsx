import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import type { ReactNode } from 'react';

import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { getReturnTo } from './auth-redirect.js';

function AuthLoadingState() {
  return (
    <section aria-label="Restoring session" className="auth-loading">
      <Skeleton className="skeleton-title" />
      <Skeleton className="auth-loading-field" />
      <Skeleton className="auth-loading-field" />
    </section>
  );
}

export function RequireAuthentication() {
  const { errorMessage, restore, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthLoadingState />;
  if (status === 'unavailable') {
    return (
      <ErrorState
        onRetry={() => {
          void restore();
        }}
        title="Session unavailable"
      >
        {errorMessage ?? 'Unable to restore your session.'}
      </ErrorState>
    );
  }
  if (status === 'unauthenticated') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/login?returnTo=${encodeURIComponent(returnTo)}`} />;
  }
  return <Outlet />;
}

export function RedirectAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') return <AuthLoadingState />;
  if (status === 'authenticated')
    return <Navigate replace to={getReturnTo(`?${searchParams.toString()}`)} />;
  return children;
}
