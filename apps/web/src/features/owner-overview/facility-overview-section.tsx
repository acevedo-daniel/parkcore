import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { OwnerParkingPanel } from '../parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../parking/use-owned-parking-operations.js';

interface FacilityOverviewSectionProps {
  parkings: ReturnType<typeof useOwnedParkingOperations>['parkings'];
}

export function FacilityOverviewSection({ parkings }: FacilityOverviewSectionProps) {
  const { t } = useAppearance();

  return (
    <section aria-labelledby="facilities-title">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-border-strong pb-4">
        <div>
          <p className="type-label text-muted-foreground">{t('overview.networkNow')}</p>
          <h2
            className="mt-2 font-display text-3xl font-bold leading-none tracking-display"
            id="facilities-title"
          >
            {t('overview.facilityOverview')}
          </h2>
        </div>
        <Link
          className="group flex shrink-0 items-center gap-1 text-sm font-bold underline decoration-brand decoration-4 underline-offset-4"
          to="/app/parkings"
        >
          {t('overview.viewAllFacilities')}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
        {parkings.slice(0, 3).map(({ parking }, index) => (
          <OwnerParkingPanel
            identifier={index + 1}
            key={parking.id}
            parking={parking}
            presentation="overview"
          />
        ))}
      </div>
    </section>
  );
}
