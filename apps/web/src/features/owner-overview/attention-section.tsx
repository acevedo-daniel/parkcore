import type { UseQueryResult } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { AttentionItem } from '../../components/domain/attention-item.js';
import { Button } from '../../components/ui/button.js';
import type { OwnerActiveSession } from '../../lib/api/owner-api.js';
import { formatElapsedHours } from '../../lib/format.js';
import { useOwnedParkingOperations } from '../parking/use-owned-parking-operations.js';
import { deriveOwnerAttentionItems } from '../../routes/owner/owner-overview-attention.js';

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
    <section
      className="rounded-2xl border border-border bg-muted p-6 sm:p-8"
      aria-labelledby="attention-title"
    >
      <p className="type-label text-muted-foreground">{t('overview.attentionEyebrow')}</p>
      <h2 className="mt-4 font-display text-2xl font-bold tracking-heading" id="attention-title">
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
        <div
          className="mt-5 flex flex-col gap-3 rounded-lg border border-warning-soft-foreground bg-warning-soft p-4 text-warning-soft-foreground"
          role="alert"
        >
          <p className="text-sm font-semibold">{t('overview.attentionDataError')}</p>
          <Button className="self-start" onClick={retryAttention} size="sm" variant="secondary">
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {t('overview.retryAttention')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
