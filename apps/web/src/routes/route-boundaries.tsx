import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Link } from 'react-router';

import { useAppearance } from '../app/appearance-provider.js';
import { Button } from '../components/ui/button.js';
import { useDocumentMeta } from '../lib/document-meta.js';

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
  useDocumentMeta({
    description: owner ? t('shell.ownerMetaDescription') : t('route.error.metaDescription'),
    noIndex: true,
    title: owner ? t('shell.ownerMetaTitle') : t('route.error.metaTitle'),
  });
  return (
    <section
      aria-labelledby="route-error-title"
      className={
        owner
          ? 'owner-page flex min-h-[55vh] items-center'
          : 'flex min-h-[65vh] items-center bg-canvas px-4 py-16 text-foreground sm:px-6 lg:px-8'
      }
      role="alert"
    >
      <div
        className={
          owner
            ? 'max-w-xl rounded-[2rem] border border-[#121417] bg-[#ffcc00] p-7 shadow-[0_10px_0_rgba(18,20,23,0.16)] sm:p-10'
            : 'mx-auto w-full max-w-3xl rounded-[2rem] border border-border-strong bg-surface p-8 shadow-hover sm:p-10'
        }
      >
        <p
          className={
            owner
              ? 'font-mono text-xs font-bold tracking-[0.16em] text-[#121417] uppercase'
              : 'font-mono text-xs font-bold tracking-[0.16em] text-foreground-muted uppercase'
          }
        >
          {notFound ? '404' : t('route.error.attention')}
        </p>
        <h1
          id="route-error-title"
          className={
            owner
              ? 'mt-5 max-w-3xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-[#121417] sm:text-6xl'
              : 'mt-5 max-w-3xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl'
          }
        >
          {t(notFound ? 'route.error.notFoundTitle' : 'route.error.title')}
        </h1>
        <p
          className={
            owner
              ? 'mt-5 max-w-xl text-base leading-relaxed text-[#34342f]'
              : 'mt-5 max-w-xl text-base leading-relaxed text-foreground-secondary'
          }
        >
          {t(notFound ? 'route.error.notFoundDescription' : 'route.error.description')}
        </p>
        {owner ? (
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#121417] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
            to="/app"
          >
            {t('route.error.ownerAction')}
          </Link>
        ) : (
          <Button asChild className="mt-7 rounded-full" variant="primary">
            <Link to="/">{t('route.error.publicAction')}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
