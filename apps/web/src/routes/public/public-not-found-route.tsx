import { Link } from 'react-router';

import { useDocumentMeta } from '../../lib/document-meta.js';

export function PublicNotFoundRoute() {
  useDocumentMeta({
    description: 'The requested ParkCore public route is unavailable.',
    title: 'No parking here | ParkCore',
  });
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
