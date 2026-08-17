import { createBrowserRouter, Outlet } from 'react-router';

import { OwnerLayout } from '../components/layout/owner-layout.js';
import { PublicLayout } from '../components/layout/public-layout.js';
import { RequireAuthentication } from '../routes/auth/auth-guard.js';
import { LoginRoute } from '../routes/auth/login-route.js';
import { RegisterRoute } from '../routes/auth/register-route.js';
import { LandingRoute } from '../routes/public/landing-route.js';
import { ParkingCatalogRoute } from '../routes/public/parking-catalog-route.js';
import { ParkingDetailRoute } from '../routes/public/parking-detail-route.js';
import { PublicNotFoundRoute } from '../routes/public/public-not-found-route.js';
import { OwnerRouteErrorBoundary, PublicRouteErrorBoundary } from '../routes/route-boundaries.js';
import { OwnerCreateParkingRoute } from '../routes/owner/owner-create-parking-route.js';
import { OwnerEditParkingRoute } from '../routes/owner/owner-edit-parking-route.js';
import { OwnerOverviewRoute } from '../routes/owner/owner-overview-route.js';
import { OwnerParkingHistoryRoute } from '../routes/owner/owner-parking-history-route.js';
import { OwnerParkingOverviewRoute } from '../routes/owner/owner-parking-overview-route.js';
import { OwnerParkingsRoute } from '../routes/owner/owner-parkings-route.js';
import { OwnerProfileRoute } from '../routes/owner/owner-profile-route.js';
import { OwnerSessionDetailRoute } from '../routes/owner/owner-session-detail-route.js';
import { RoutePending } from '../routes/route-pending.js';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <Outlet />,
        errorElement: <PublicRouteErrorBoundary />,
        children: [
          { index: true, element: <LandingRoute /> },
          { path: 'parkings', element: <ParkingCatalogRoute /> },
          { path: 'parkings/:parkingId', element: <ParkingDetailRoute /> },
          { path: 'login', element: <LoginRoute /> },
          { path: 'register', element: <RegisterRoute /> },
          { path: '*', element: <PublicNotFoundRoute /> },
        ],
      },
    ],
  },
  {
    path: 'app',
    element: <RequireAuthentication />,
    children: [
      {
        element: <OwnerLayout />,
        children: [
          {
            element: <Outlet />,
            errorElement: <OwnerRouteErrorBoundary />,
            children: [
              { index: true, element: <OwnerOverviewRoute /> },
              { path: 'parkings', element: <OwnerParkingsRoute /> },
              { path: 'parkings/new', element: <OwnerCreateParkingRoute /> },
              {
                path: 'parkings/:parkingId',
                element: <OwnerParkingOverviewRoute />,
              },
              {
                path: 'parkings/:parkingId/edit',
                element: <OwnerEditParkingRoute />,
              },
              {
                path: 'parkings/:parkingId/sessions',
                element: <OwnerParkingHistoryRoute />,
              },
              {
                path: 'sessions/:sessionId',
                element: <OwnerSessionDetailRoute />,
              },
              { path: 'profile', element: <OwnerProfileRoute /> },
              { path: '*', element: <RoutePending title="Route unavailable" /> },
            ],
          },
        ],
      },
    ],
  },
]);
