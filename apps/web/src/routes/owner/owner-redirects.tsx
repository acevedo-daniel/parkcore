import { Navigate, useLocation, useParams } from 'react-router';

export function RegisterRedirect() {
  const location = useLocation();
  return <Navigate replace to={{ pathname: '/login', search: location.search }} />;
}

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
