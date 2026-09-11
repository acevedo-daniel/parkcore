import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function PublicNotFoundRoute() {
  const { t } = useAppearance();
  useDocumentMeta({
    description: t('public.notFound.metaDescription'),
    noIndex: true,
    title: t('public.notFound.metaTitle'),
  });
  return (
    <section className="min-h-[65vh] bg-accent px-4 py-16 text-accent-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs font-bold tracking-[0.16em] uppercase">404</p>
        <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl">
          {t('public.notFound.title')}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-accent-foreground/80 sm:text-lg">
          {t('public.notFound.description')}
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          to="/parkings"
        >
          {t('public.notFound.action')}
        </Link>
      </div>
    </section>
  );
}
