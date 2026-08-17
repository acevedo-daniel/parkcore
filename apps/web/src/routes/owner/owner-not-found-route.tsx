import { Link } from 'react-router';

export function OwnerNotFoundRoute() {
  return (
    <section className="route-error route-error-owner" aria-labelledby="owner-not-found-title">
      <p className="type-label">404</p>
      <h1 className="type-page-title" id="owner-not-found-title">
        Route unavailable
      </h1>
      <p className="field-help">This owner route does not exist in ParkCore.</p>
      <Link className="button button-primary" to="/app">
        Back to operations
      </Link>
    </section>
  );
}
