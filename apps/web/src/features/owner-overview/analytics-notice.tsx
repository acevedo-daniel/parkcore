import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';

export function AnalyticsNotice({ onRetry }: { onRetry: () => void }) {
  const { t } = useAppearance();

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-warning-soft-foreground bg-warning-soft p-4 text-warning-soft-foreground sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm font-semibold">{t('overview.analyticsDegraded')}</p>
      <Button onClick={onRetry} size="sm" variant="secondary">
        {t('overview.retryAnalytics')}
      </Button>
    </div>
  );
}
