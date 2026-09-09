import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  OwnerParkingEditRedirect,
  OwnerParkingHistoryRedirect,
  OwnerParkingRedirect,
} from './owner-redirects.js';

describe('Owner backward-compatibility redirects', () => {
  it('redirects /owner/parkings/:parkingId to /app/parkings/:parkingId', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/owner/parkings/:parkingId',
          element: <OwnerParkingRedirect />,
        },
        {
          path: '/app/parkings/:parkingId',
          element: <div>Canonical Parking View</div>,
        },
      ],
      { initialEntries: ['/owner/parkings/parking-xyz'] },
    );

    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Canonical Parking View')).toBeTruthy();
  });

  it('redirects /owner/parkings/:parkingId/edit to /app/parkings/:parkingId/edit', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/owner/parkings/:parkingId/edit',
          element: <OwnerParkingEditRedirect />,
        },
        {
          path: '/app/parkings/:parkingId/edit',
          element: <div>Canonical Parking Edit View</div>,
        },
      ],
      { initialEntries: ['/owner/parkings/parking-xyz/edit'] },
    );

    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Canonical Parking Edit View')).toBeTruthy();
  });

  it('redirects /owner/parkings/:parkingId/history to /app/parkings/:parkingId/sessions', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/owner/parkings/:parkingId/history',
          element: <OwnerParkingHistoryRedirect />,
        },
        {
          path: '/app/parkings/:parkingId/sessions',
          element: <div>Canonical Parking Sessions View</div>,
        },
      ],
      { initialEntries: ['/owner/parkings/parking-xyz/history'] },
    );

    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Canonical Parking Sessions View')).toBeTruthy();
  });
});
