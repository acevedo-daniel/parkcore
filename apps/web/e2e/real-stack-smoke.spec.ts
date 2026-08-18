import { expect, test } from '@playwright/test';

test('registers, operates, completes, and cleans up a real parking session', async ({ page }) => {
  const timestamp = Date.now();
  const runId = Math.floor(timestamp / 1000)
    .toString(36)
    .toUpperCase();
  const email = `real-smoke-${runId}-${String(timestamp)}@example.com`;
  const plate = `RS${runId}`;

  await page.goto('/');
  await page.getByRole('link', { name: 'Parkings', exact: true }).click();
  await expect(page).toHaveURL(/\/parkings$/);
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.getByLabel('Name (optional)').fill('Real Stack Smoke');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('ParkCoreRealSmoke!');
  const registerResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/auth/register') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create account' }).click();
  const apiBaseUrl = new URL((await registerResponse).url()).origin;
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('ParkCoreRealSmoke!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.reload();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('link', { name: 'Create parking' })).toBeVisible();

  await page.getByRole('link', { name: 'Create parking' }).click();
  await page.getByLabel('Name').fill(`Real smoke ${runId}`);
  await page.getByLabel('Address').fill('511 Production Smoke Avenue');
  await page.getByLabel('Latitude').fill('-34.61');
  await page.getByLabel('Longitude').fill('-58.38');
  await page.getByLabel('Capacity').fill('3');
  await page.getByLabel('Hourly rate (USD)').fill('12.34');
  await page.getByRole('button', { name: 'Create parking' }).click();
  await expect(page).toHaveURL(/\/app\/parkings\/[0-9a-f-]{36}$/i);

  const parkingIdMatch = /\/app\/parkings\/([0-9a-f-]{36})$/i.exec(page.url());
  if (!parkingIdMatch) throw new Error('Created parking URL did not include an ID.');
  const parkingId = parkingIdMatch[1];
  await page.reload();
  await expect(page.getByRole('button', { name: 'Check in', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByLabel('Plate').fill(plate);
  await page.getByLabel('Type').selectOption('CAR');
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByRole('link', { name: `Open session for ${plate}` })).toBeVisible();

  await page.getByRole('link', { name: `Open session for ${plate}` }).click();
  await page.getByRole('button', { name: 'Check out' }).click();
  const checkout = page.getByRole('dialog', { name: 'Complete checkout' });
  await expect(checkout.getByLabel('Checkout summary')).toBeVisible();
  await checkout.getByRole('button', { name: 'Complete checkout', exact: true }).click();
  await expect(page.getByText('Session checked out.', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Parking operation' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  const completedSession = page.getByRole('link', { name: `Open session for ${plate}` });
  await expect(completedSession).toContainText('Completed');

  const token = await page.evaluate(() => {
    const storage = (
      globalThis as unknown as {
        localStorage: { getItem: (key: string) => string | null };
      }
    ).localStorage;
    return storage.getItem('parkcore.access-token');
  });
  const cleanup = await page.request.patch(`${apiBaseUrl}/parkings/${parkingId}`, {
    data: { isActive: false },
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
  expect(cleanup.status()).toBe(200);

  await page.goto('/app');
  await page.evaluate(() => {
    const storage = (
      globalThis as unknown as {
        localStorage: { setItem: (key: string, value: string) => void };
      }
    ).localStorage;
    storage.setItem('parkcore.access-token', 'invalid-token');
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp$/);
});
