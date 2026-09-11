import { expect, test } from '@playwright/test';

test('operates, completes, and cleans up a real parking session', async ({ page }) => {
  const email = 'owner@parkcore.dev';
  const password = 'ParkCoreLocalE2ESeed!123';
  const plate = 'RSLOCAL1';

  await page.addInitScript("localStorage.setItem('parkcore-lang', 'en');");
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  const loginResponse = page.waitForResponse(
    (response) => response.url().endsWith('/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Sign in' }).click();
  const apiBaseUrl = new URL((await loginResponse).url()).origin;
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.reload();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('link', { name: 'New facility' })).toBeVisible();

  await page.getByRole('link', { name: 'New facility' }).click();
  await page.getByLabel('Name').fill('Local real-stack smoke');
  await page.getByLabel('Neighborhood').fill('Downtown');
  await page.getByLabel('Address').fill('511 Local Smoke Avenue');
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
  await page.getByRole('textbox', { name: 'Plate' }).fill(plate);
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
