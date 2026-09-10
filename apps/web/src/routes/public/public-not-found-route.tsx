import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function PublicNotFoundRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  useDocumentMeta({
    description: 'The requested ParkCore public route is unavailable.',
    noIndex: true,
    title: 'No parking here | ParkCore',
  });
  return (
    <section className="min-h-[65vh] bg-[#ffcc00] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#121417] uppercase">
          404
        </p>
        <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.92] tracking-[-0.065em] text-[#121417] sm:text-7xl">
          {es ? 'Por acá no hay cochera.' : 'There is no parking here.'}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#34342f] sm:text-lg">
          {es
            ? 'Volvé al directorio y encontrá una cochera que te quede cerca.'
            : 'Return to the directory and find a facility near you.'}
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#121417] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
          to="/parkings"
        >
          {es ? 'Ver cocheras' : 'Explore facilities'}
        </Link>
      </div>
    </section>
  );
}
