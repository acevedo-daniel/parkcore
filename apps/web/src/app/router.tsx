import { createBrowserRouter, Outlet } from 'react-router';

import { OwnerLayout } from '../components/layout/owner-layout.js';
import { PublicLayout } from '../components/layout/public-layout.js';
import { RequireAuthentication } from '../routes/auth/auth-guard.js';
import { OwnerRouteErrorBoundary, PublicRouteErrorBoundary } from '../routes/route-boundaries.js';
import { RoutePending } from '../routes/route-pending.js';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <Outlet />,
        errorElement: <PublicRouteErrorBoundary />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('../routes/public/landing-route.js')).LandingRoute,
            }),
          },
          {
            path: 'parkings',
            lazy: async () => ({
              Component: (await import('../routes/public/parking-catalog-route.js'))
                .ParkingCatalogRoute,
            }),
          },
          {
            path: 'parkings/:parkingId',
            lazy: async () => ({
              Component: (await import('../routes/public/parking-detail-route.js'))
                .ParkingDetailRoute,
            }),
          },
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('../routes/auth/login-route.js')).LoginRoute,
            }),
          },
          {
            path: 'register',
            lazy: async () => ({
              Component: (await import('../routes/auth/register-route.js')).RegisterRoute,
            }),
          },
          {
            path: '*',
            lazy: async () => ({
              Component: (await import('../routes/public/public-not-found-route.js'))
                .PublicNotFoundRoute,
            }),
          },
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
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-overview-route.js'))
                    .OwnerOverviewRoute,
                }),
              },
              {
                path: 'parkings',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-parkings-route.js'))
                    .OwnerParkingsRoute,
                }),
              },
              {
                path: 'parkings/new',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-create-parking-route.js'))
                    .OwnerCreateParkingRoute,
                }),
              },
              {
                path: 'parkings/:parkingId',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-parking-overview-route.js'))
                    .OwnerParkingOverviewRoute,
                }),
              },
              {
                path: 'parkings/:parkingId/edit',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-edit-parking-route.js'))
                    .OwnerEditParkingRoute,
                }),
              },
              {
                path: 'parkings/:parkingId/sessions',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-parking-history-route.js'))
                    .OwnerParkingHistoryRoute,
                }),
              },
              {
                path: 'sessions/:sessionId',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-session-detail-route.js'))
                    .OwnerSessionDetailRoute,
                }),
              },
              {
                path: 'profile',
                lazy: async () => ({
                  Component: (await import('../routes/owner/owner-profile-route.js'))
                    .OwnerProfileRoute,
                }),
              },
              { path: '*', element: <RoutePending title="Route unavailable" /> },
            ],
          },
        ],
      },
    ],
  },
]);
