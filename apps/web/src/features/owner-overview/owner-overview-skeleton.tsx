import { useAppearance } from '../../app/appearance-provider.js';
import { Skeleton } from '../../components/ui/skeleton.js';

export function OwnerOverviewSkeleton() {
  const { t } = useAppearance();

  return (
    <div aria-busy="true" aria-label={t('overview.loading')} className="space-y-10" role="status">
      <h1 className="sr-only">{t('overview.title')}</h1>
      <div className="grid gap-5 wide:grid-cols-owner-overview">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
