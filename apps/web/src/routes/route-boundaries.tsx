import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Link } from 'react-router';

import { useAppearance } from '../app/appearance-provider.js';

export function PublicRouteErrorBoundary() {
  return <RouteErrorBoundary tone="public" />;
}

export function OwnerRouteErrorBoundary() {
  return <RouteErrorBoundary tone="owner" />;
}

function RouteErrorBoundary({ tone }: { tone: 'owner' | 'public' }) {
  const { t } = useAppearance();
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const owner = tone === 'owner';
  return (
    <section
      className={
        owner
          ? 'owner-page flex min-h-[55vh] items-center'
          : 'flex min-h-[65vh] items-center bg-[#ffcc00] px-4 py-16 sm:px-6 lg:px-8'
      }
      role="alert"
    >
      <div
        className={
          owner
            ? 'max-w-xl rounded-[2rem] border border-[#121417] bg-[#ffcc00] p-7 shadow-[0_10px_0_rgba(18,20,23,0.16)] sm:p-10'
            : 'mx-auto w-full max-w-4xl'
        }
      >
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#121417] uppercase">
          {notFound ? '404' : t('route.error.attention')}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-[#121417] sm:text-6xl">
          {t(notFound ? 'route.error.notFoundTitle' : 'route.error.title')}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#34342f]">
          {t(notFound ? 'route.error.notFoundDescription' : 'route.error.description')}
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#121417] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
          to={owner ? '/app' : '/'}
        >
          {t(owner ? 'route.error.ownerAction' : 'route.error.publicAction')}
        </Link>
      </div>
    </section>
  );
}
