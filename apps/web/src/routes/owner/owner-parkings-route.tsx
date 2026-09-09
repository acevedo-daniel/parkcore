import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingListItem } from '../../components/domain/parking.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';

export function OwnerParkingsRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  if (parkingsQuery.isLoading) return <Skeleton className="owner-list-skeleton" />;
  if (parkingsQuery.isError)
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
        }}
      >
        We could not load your parkings.
      </ErrorState>
    );
  return (
    <section className="owner-page stack-owner" aria-labelledby="owner-parkings-title">
      <header className="owner-page-header">
        <div>
          <p className="type-label">{es ? 'Gestión' : 'Management'}</p>
          <h1 className="type-page-title" id="owner-parkings-title">
            {es ? 'Cocheras' : 'Parkings'}
          </h1>
        </div>
        <Link className="button button-primary" to="/app/parkings/new">
          {es ? 'Crear cochera' : 'Create parking'}
        </Link>
      </header>
      {parkingsQuery.isFetching ? (
        <p className="query-status" role="status">
          Refreshing parkings…
        </p>
      ) : null}
      {parkings.length === 0 ? (
        <EmptyState
          action={
            <Link className="button button-primary" to="/app/parkings/new">
              {es ? 'Crear cochera' : 'Create parking'}
            </Link>
          }
          title={es ? 'Todavía no hay cocheras' : 'No parkings yet'}
        >
          {es ? 'Tus cocheras aparecerán acá.' : 'Your parking facilities will appear here.'}
        </EmptyState>
      ) : (
        <div className="owner-parking-list">
          {parkings.map(({ activeSessionCount, occupancyError, parking }, index) => (
            <ParkingListItem
              activeSessions={activeSessionCount}
              identifier={index + 1}
              key={parking.id}
              occupancyUnavailable={occupancyError}
              parking={parking}
              to={`/app/parkings/${parking.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
