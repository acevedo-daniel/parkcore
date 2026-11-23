import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Notice } from '../../components/domain/notice.js';

export function AnalyticsNotice({ onRetry }: { onRetry: () => void }) {
  const { t } = useAppearance();

  return (
    <Notice
      action={
        <Button onClick={onRetry} size="sm" variant="secondary">
          {t('overview.retryAnalytics')}
        </Button>
      }
      role="alert"
    >
      {t('overview.analyticsDegraded')}
    </Notice>
  );
}
