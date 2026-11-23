import type { UseQueryResult } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { AttentionItem } from '../../components/domain/attention-item.js';
import { Button } from '../../components/ui/button.js';
import type { OwnerActiveSession } from '../../lib/api/owner-api.js';
import { formatElapsedHours } from '../../lib/format.js';
import { useOwnedParkingOperations } from '../parking/use-owned-parking-operations.js';
import { deriveOwnerAttentionItems } from '../../routes/owner/owner-overview-attention.js';
import { Notice } from '../../components/domain/notice.js';
import { Card } from '../../components/ui/card.js';

interface AttentionSectionProps {
  activeSessionsQuery: UseQueryResult<OwnerActiveSession[]>;
  parkings: ReturnType<typeof useOwnedParkingOperations>['parkings'];
}

export function AttentionSection({ activeSessionsQuery, parkings }: AttentionSectionProps) {
  const { locale, t } = useAppearance();
  const activeSessionsByParking = new Map<string, OwnerActiveSession[]>();
  for (const session of activeSessionsQuery.data ?? []) {
    const sessions = activeSessionsByParking.get(session.parkingId) ?? [];
    sessions.push(session);
    activeSessionsByParking.set(session.parkingId, sessions);
  }

  const attentionItems = deriveOwnerAttentionItems(
    parkings.map(({ parking }) => ({
      activeSessions: activeSessionsByParking.get(parking.id) ?? [],
      parking,
    })),
    new Date(),
  ).map((item) => ({
    ...item,
    description:
      item.state === 'FULL'
        ? t('overview.attentionFull')
        : item.state === 'LIMITED'
          ? t('overview.attentionLimited')
          : item.state === 'LONG_RUNNING'
            ? t('overview.attentionLongRunning', {
                duration: formatElapsedHours(item.durationHours ?? 8, locale),
              })
            : t('overview.attentionPaused'),
  }));
  const retryAttention = () => {
    if (activeSessionsQuery.isError) void activeSessionsQuery.refetch();
  };

  return (
    <Card asChild>
      <section className="p-5 sm:p-6" aria-labelledby="attention-title">
        <p className="type-label text-muted-foreground">{t('overview.attentionEyebrow')}</p>
        <h2 className="type-heading mt-4" id="attention-title">
          {attentionItems.length > 0
            ? t('overview.attentionNeedsReview')
            : t('overview.attentionNormal')}
        </h2>
        {attentionItems.length > 0 ? (
          <ul className="mt-5">
            {attentionItems.map((item) => (
              <AttentionItem
                description={item.description}
                key={`${item.state}-${item.parkingId}-${item.sessionId ?? 'facility'}`}
                parkingTitle={item.parkingTitle}
                plate={item.plate}
                state={item.state}
                to={item.to}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
            {t('overview.attentionNone')}
          </p>
        )}
        {activeSessionsQuery.isError ? (
          <Notice
            action={
              <Button onClick={retryAttention} size="sm" variant="secondary">
                <RefreshCw aria-hidden="true" className="size-3.5" />
                {t('overview.retryAttention')}
              </Button>
            }
            className="mt-5"
            layout="stacked"
            role="alert"
          >
            {t('overview.attentionDataError')}
          </Notice>
        ) : null}
      </section>
    </Card>
  );
}
