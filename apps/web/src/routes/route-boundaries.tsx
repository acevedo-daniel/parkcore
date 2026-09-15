import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { useAppearance } from '../app/appearance-provider.js';
import { Button } from '../components/ui/button.js';
import { useDocumentMeta } from '../lib/document-meta.js';

export function PublicRouteErrorBoundary() {
  return <RouteErrorBoundary tone="public" />;
}

export function OwnerRouteErrorBoundary() {
  return <RouteErrorBoundary tone="owner" />;
}

export function OwnerRouteRecovery() {
  return <RouteRecovery owner notFound />;
}

function RouteErrorBoundary({ tone }: { tone: 'owner' | 'public' }) {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return <RouteRecovery notFound={notFound} owner={tone === 'owner'} />;
}

function RouteRecovery({ notFound, owner }: { notFound: boolean; owner: boolean }) {
  const { t } = useAppearance();
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
            ? 'w-full min-w-0 max-w-xl rounded-[var(--radius-xl)] border border-accent-foreground/30 bg-accent-soft p-7 shadow-hover sm:p-10'
            : 'mx-auto w-full max-w-3xl rounded-[var(--radius-xl)] border border-border-strong bg-surface p-8 shadow-hover sm:p-10'
        }
      >
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-foreground-muted uppercase">
          {notFound ? '404' : t('route.error.attention')}
        </p>
        <h1
          className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl"
          id="route-error-title"
        >
          {t(notFound ? 'route.error.notFoundTitle' : 'route.error.title')}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-secondary">
          {t(notFound ? 'route.error.notFoundDescription' : 'route.error.description')}
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <Button asChild className="rounded-full" variant="primary">
            <Link to={owner ? '/app' : '/'}>
              {t(owner ? 'route.error.ownerAction' : 'route.error.publicAction')}
            </Link>
          </Button>
          {owner ? (
            <Button asChild className="rounded-full" variant="secondary">
              <Link to="/app/parkings">{t('route.error.ownerParkingsAction')}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
