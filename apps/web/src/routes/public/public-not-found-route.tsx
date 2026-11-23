import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { Card } from '../../components/ui/card.js';

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
      className="min-h-page-state bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8"
    >
      <Card asChild>
        <div className="mx-auto max-w-3xl p-6 sm:p-8">
          <p className="type-eyebrow text-muted-foreground">404</p>
          <h1
            className="type-page-title mt-6 max-w-full break-words text-foreground"
            id="public-not-found-title"
          >
            {t('public.notFound.title')}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
            {t('public.notFound.description')}
          </p>
          <Button asChild className="mt-8" shape="pill" size="lg" variant="default">
            <Link to="/parkings">{t('public.notFound.action')}</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
