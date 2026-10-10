import { useAppearance } from '../../app/appearance-provider.js';
import { useAnalyticsSummary } from '../analytics/use-analytics.js';
import { useOwnedParkingOperations } from '../parking/use-owned-parking-operations.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

interface NetworkSummarySectionProps {
  parkings: ReturnType<typeof useOwnedParkingOperations>['parkings'];
  summaryQuery: ReturnType<typeof useAnalyticsSummary>;
}

export function NetworkSummarySection({ parkings, summaryQuery }: NetworkSummarySectionProps) {
  const { locale, t, tPlural } = useAppearance();
  const formatCount = (value: number) => formatNumber(value, locale);
  const summary = summaryQuery.data;
  const fallbackNetwork = parkings.reduce(
    (totals, { parking }) => ({
      activeVehicles: totals.activeVehicles + Math.max(0, parking.activeSessionCount),
      freeSpaces: totals.freeSpaces + Math.max(0, parking.availableSpaces),
      totalCapacity: totals.totalCapacity + Math.max(0, parking.capacity),
    }),
    { activeVehicles: 0, freeSpaces: 0, totalCapacity: 0 },
  );
  const activeVehicles = summary?.activeVehicles ?? fallbackNetwork.activeVehicles;
  const totalCapacity = summary?.totalCapacity ?? fallbackNetwork.totalCapacity;
  const freeSpaces = summary
    ? Math.max(0, summary.totalCapacity - summary.activeVehicles)
    : fallbackNetwork.freeSpaces;
  const totalFacilities = summary?.facilities.length ?? parkings.length;
  const activeFacilities = summary
    ? summary.facilities.filter((facility) => facility.isActive).length
    : parkings.filter(({ parking }) => parking.isActive).length;
  const receivingFacilities = summary
    ? summary.facilities.filter((facility) => facility.activeVehicles > 0).length
    : parkings.filter(({ parking }) => parking.activeSessionCount > 0).length;
  const pausedFacilities = totalFacilities - activeFacilities;
  const completedToday = summaryQuery.isPending
    ? t('overview.loadingValue')
    : summary
      ? formatCount(summary.completedToday)
      : t('common.notAvailable');

  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8"
      aria-labelledby="network-now-title"
    >
      <p className="type-label text-muted-foreground">{t('overview.networkNow')}</p>
      <h2
        className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight tracking-heading sm:text-4xl"
        id="network-now-title"
      >
        {tPlural(
          activeVehicles,
          {
            one: 'overview.networkStatementOne',
            other: 'overview.networkStatementOther',
          },
          { count: formatCount(activeVehicles) },
        )}
      </h2>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-secondary">
        {t('overview.networkCapacityStatement', {
          free: formatCount(freeSpaces),
          receiving: formatCount(receivingFacilities),
          total: formatCount(totalFacilities),
        })}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-border-subtle pt-5 sm:grid-cols-4">
        <SummaryMetric
          label={t('overview.networkActiveVehicles')}
          value={formatCount(activeVehicles)}
        />
        <SummaryMetric label={t('overview.freeSpaces')} value={formatCount(freeSpaces)} />
        <SummaryMetric label={t('overview.capacity')} value={formatCount(totalCapacity)} />
        <SummaryMetric label={t('overview.completedToday')} value={completedToday} />
      </dl>

      <div className="mt-6 border-t border-border-subtle pt-5">
        <p className="type-label text-muted-foreground">{t('overview.facilityState')}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-foreground-secondary">
          <span>
            {tPlural(
              activeFacilities,
              {
                one: 'overview.enabledFacilitiesOne',
                other: 'overview.enabledFacilitiesOther',
              },
              { count: formatCount(activeFacilities) },
            )}
          </span>
          <span>
            {tPlural(
              pausedFacilities,
              {
                one: 'overview.pausedFacilitiesOne',
                other: 'overview.pausedFacilitiesOther',
              },
              { count: formatCount(pausedFacilities) },
            )}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-border-subtle pt-5">
        <p className="type-label text-muted-foreground">{t('overview.revenueToday')}</p>
        {summaryQuery.isPending ? (
          <p className="mt-2 type-operational text-lg font-bold">{t('overview.loadingValue')}</p>
        ) : summaryQuery.isError ? (
          <p className="mt-2 type-operational text-lg font-bold">{t('common.notAvailable')}</p>
        ) : summary?.revenueToday.length ? (
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {summary.revenueToday.map(({ currency, revenueCents }) => (
              <div className="flex items-baseline gap-2" key={currency}>
                <span className="type-label text-muted-foreground">{currency}</span>
                <span className="type-operational text-lg font-bold">
                  {formatMoney(revenueCents, currency, locale)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-foreground-secondary">{t('overview.noRevenueToday')}</p>
        )}
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words type-metric">{value}</dd>
    </div>
  );
}
