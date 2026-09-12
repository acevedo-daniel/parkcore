import { Navigate, useParams } from 'react-router';

export function OwnerParkingRedirect() {
  const { parkingId } = useParams();
  return <Navigate replace to={`/app/parkings/${parkingId ?? ''}`} />;
}

export function OwnerParkingEditRedirect() {
  const { parkingId } = useParams();
  return <Navigate replace to={`/app/parkings/${parkingId ?? ''}/edit`} />;
}

export function OwnerParkingHistoryRedirect() {
  const { parkingId } = useParams();
  return <Navigate replace to={`/app/parkings/${parkingId ?? ''}/sessions`} />;
}
