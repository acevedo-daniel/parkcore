import { expect, test } from '@playwright/test';

import type { components } from '@parkcore/api-client';

type Parking = components['schemas']['ParkingResponse'];
type ParkingSession = components['schemas']['ParkingSessionResponse'];
type User = components['schemas']['UserResponse'];

const owner: User = {
  createdAt: '2026-08-17T09:00:00.000Z',
  email: 'owner@parkcore.test',
  id: 'owner-1',
  lastName: null,
  name: 'ParkCore Owner',
  phone: null,
  photoUrl: null,
  updatedAt: '2026-08-17T09:00:00.000Z',
};

function sessionList(data: ParkingSession[]) {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 50,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
  } satisfies components['schemas']['ParkingSessionListResponse'];
}

test('serves the SPA entry for direct public and owner routes', async ({ request }) => {
  for (const path of ['/parkings/parking-1', '/app/parkings/parking-1']) {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    await expect(response.text()).resolves.toContain('<div id="root">');
  }
});

test('registers, creates a parking, checks in, and completes a parking session', async ({
  page,
}) => {
  let parking: Parking | undefined;
  let session: ParkingSession | undefined;

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (body: unknown, status = 200) =>
      route.fulfill({ body: JSON.stringify(body), contentType: 'application/json', status });

    if (request.method() === 'POST' && url.pathname === '/auth/register') {
      await respond({ accessToken: 'e2e-token', user: owner }, 201);
      return;
    }
    if (request.method() === 'GET' && url.pathname === '/parkings/me') {
      await respond(parking ? [parking] : []);
      return;
    }
    if (request.method() === 'POST' && url.pathname === '/parkings') {
      parking = {
        address: '202 North Street',
        capacity: 20,
        createdAt: '2026-08-17T09:05:00.000Z',
        currency: 'USD',
        description: null,
        hourlyRateCents: 1850,
        id: 'parking-1',
        image: null,
        isActive: true,
        lat: -34.61,
        lng: -58.38,
        ownerId: owner.id,
        title: 'North Garage',
        updatedAt: '2026-08-17T09:05:00.000Z',
      };
      await respond(parking, 201);
      return;
    }
    if (request.method() === 'GET' && url.pathname === '/parkings/parking-1/sessions/active') {
      await respond(session?.status === 'ACTIVE' ? [session] : []);
      return;
    }
    if (request.method() === 'POST' && url.pathname === '/parkings/parking-1/sessions/check-in') {
      session = {
        createdAt: '2026-08-17T10:00:00.000Z',
        currency: 'USD',
        customerName: null,
        customerPhone: null,
        endTime: null,
        hourlyRateCents: 1850,
        id: 'session-1',
        notes: null,
        parkingId: 'parking-1',
        startTime: '2026-08-17T10:00:00.000Z',
        status: 'ACTIVE',
        totalAmountCents: null,
        updatedAt: '2026-08-17T10:00:00.000Z',
        vehicle: {
          brand: null,
          id: 'vehicle-1',
          model: null,
          plate: 'AB123CD',
          type: 'CAR',
        },
        vehicleId: 'vehicle-1',
      };
      await respond(session, 201);
      return;
    }
    if (request.method() === 'GET' && url.pathname === '/sessions/session-1') {
      await respond(session);
      return;
    }
    if (request.method() === 'POST' && url.pathname === '/sessions/session-1/check-out') {
      if (!session) {
        await respond({ error: true, message: 'Parking session is unavailable.' }, 404);
        return;
      }
      session = {
        ...session,
        endTime: '2026-08-17T11:00:00.000Z',
        status: 'COMPLETED',
        totalAmountCents: 1850,
        updatedAt: '2026-08-17T11:00:00.000Z',
      };
      await respond(session);
      return;
    }
    if (request.method() === 'GET' && url.pathname === '/parkings/parking-1/sessions') {
      await respond(sessionList(session ? [session] : []));
      return;
    }
    await respond(
      { error: true, message: `Unexpected request: ${request.method()} ${url.pathname}` },
      500,
    );
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await page.getByLabel('Name (optional)').fill('ParkCore Owner');
  await page.getByLabel('Email').fill(owner.email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole('link', { name: 'Create parking' }).click();

  await page.getByLabel('Name').fill('North Garage');
  await page.getByLabel('Address').fill('202 North Street');
  await page.getByLabel('Latitude').fill('-34.61');
  await page.getByLabel('Longitude').fill('-58.38');
  await page.getByLabel('Capacity').fill('20');
  await page.getByLabel('Hourly rate (USD)').fill('18.5');
  await page.getByRole('button', { name: 'Create parking' }).click();
  await expect(page).toHaveURL(/\/app\/parkings\/parking-1$/);

  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByLabel('Plate').fill('ab-123 cd');
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByRole('link', { name: 'Open session for AB123CD' })).toBeVisible();

  await page.getByRole('link', { name: 'Open session for AB123CD' }).click();
  await page.getByRole('button', { name: 'Check out' }).click();
  const checkout = page.getByRole('dialog', { name: 'Complete checkout' });
  await expect(checkout.getByLabel('Checkout summary')).toBeVisible();
  await checkout.getByRole('button', { name: 'Complete checkout', exact: true }).click();
  await expect(page.getByText('Session checked out.', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Parking operation' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  const completedSession = page.getByRole('link', { name: 'Open session for AB123CD' });
  await expect(completedSession).toContainText('Completed');
  await expect(completedSession).toContainText('$18.50');
});
