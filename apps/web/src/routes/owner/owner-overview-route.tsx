import { Link } from 'react-router';

import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';

export function OwnerOverviewRoute() {
  const { parkings, parkingsQuery } = useOwnedParkingOperations();

  if (parkingsQuery.isLoading) return <OwnerPanelsSkeleton />;
  if (parkingsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
        }}
      >
        We could not load your parking operations.
      </ErrorState>
    );
  }
  if (parkings.length === 0) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" to="/app/parkings/new">
            Create parking
          </Link>
        }
        title="No parking operations yet"
      >
        Create your first facility to start recording visits.
      </EmptyState>
    );
  }
  return (
    <section className="owner-page stack-owner" aria-labelledby="overview-title">
      <header className="owner-page-header">
        <div>
          <p className="type-label">Operations</p>
          <h1 className="type-page-title" id="overview-title">
            Current facilities
          </h1>
        </div>
        <Link className="button button-primary" to="/app/parkings/new">
          Create parking
        </Link>
      </header>
      <div className="owner-parking-panels">
        {parkings.map(({ activeSessionCount, parking }, index) => (
          <OwnerParkingPanel
            activeSessionCount={activeSessionCount}
            identifier={index + 1}
            key={parking.id}
            parking={parking}
          />
        ))}
      </div>
      <Link className="button button-secondary owner-list-link" to="/app/parkings">
        Manage parkings
      </Link>
    </section>
  );
}

function OwnerPanelsSkeleton() {
  return (
    <div className="owner-parking-panels" aria-label="Loading parking operations">
      <Skeleton className="owner-panel-skeleton" />
      <Skeleton className="owner-panel-skeleton" />
    </div>
  );
}
