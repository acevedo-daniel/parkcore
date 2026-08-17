import { Link } from 'react-router';

export function PublicNotFoundRoute() {
  return (
    <section className="public-not-found">
      <p className="type-label">404</p>
      <h1 className="type-hero">
        No parking
        <br />
        here.
      </h1>
      <p className="landing-intro">The route you requested is not part of ParkCore.</p>
      <Link className="button button-primary" to="/parkings">
        Explore parkings
      </Link>
    </section>
  );
}
