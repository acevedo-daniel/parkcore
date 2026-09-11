import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { useDocumentMeta } from '../../lib/document-meta.js';

export function PublicNotFoundRoute() {
  const { t } = useAppearance();
  useDocumentMeta({
    description: t('public.notFound.metaDescription'),
    noIndex: true,
    title: t('public.notFound.metaTitle'),
  });
  return (
    <section
      aria-labelledby="public-not-found-title"
      className="min-h-[65vh] bg-canvas px-4 py-16 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-border-strong bg-surface p-8 shadow-hover sm:p-10">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-foreground-muted uppercase">
          404
        </p>
        <h1
          className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.92] tracking-[-0.065em] text-foreground sm:text-7xl"
          id="public-not-found-title"
        >
          {t('public.notFound.title')}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
          {t('public.notFound.description')}
        </p>
        <Button asChild className="mt-8 rounded-full" size="lg" variant="primary">
          <Link to="/parkings">{t('public.notFound.action')}</Link>
        </Button>
      </div>
    </section>
  );
}
