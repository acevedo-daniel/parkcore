import { isRouteErrorResponse, useRouteError } from 'react-router';

export function PublicRouteErrorBoundary() {
  return <RouteErrorBoundary tone="public" />;
}

export function OwnerRouteErrorBoundary() {
  return <RouteErrorBoundary tone="owner" />;
}

function RouteErrorBoundary({ tone }: { tone: 'owner' | 'public' }) {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const message = notFound
    ? 'The requested route does not exist.'
    : 'We could not load this route.';
  return (
    <section className={`route-error route-error-${tone}`} role="alert">
      <p className="type-label">{notFound ? 'Not found' : 'Route error'}</p>
      <h1 className="type-page-title">{notFound ? 'Page unavailable' : 'Something went wrong'}</h1>
      <p className="field-help">{message}</p>
    </section>
  );
}
