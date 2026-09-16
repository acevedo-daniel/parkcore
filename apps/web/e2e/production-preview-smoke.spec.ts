import { expect, test } from '@playwright/test';

const localApiUrl = 'http://127.0.0.1:3000';

test('serves public and protected journeys through the configured API origin', async ({
  page,
  request,
}) => {
  const healthResponse = await request.get(`${localApiUrl}/healthz`);
  expect(healthResponse.status()).toBe(200);
  expect(await healthResponse.json()).toEqual({ status: 'ok' });

  const rootResponse = await request.get(`${localApiUrl}/`);
  expect(rootResponse.status()).toBe(200);
  expect(await rootResponse.json()).toEqual({ status: 'ok', service: 'parkcore-api' });

  const apiRequests = new Map<string, number>();
  const apiOrigins = new Set<string>();

  page.on('request', (requestEvent) => {
    if (!['fetch', 'xhr'].includes(requestEvent.resourceType())) {
      return;
    }

    const requestUrl = new URL(requestEvent.url());

    if (requestUrl.origin !== localApiUrl) {
      return;
    }

    apiOrigins.add(requestUrl.origin);
    apiRequests.set(requestUrl.pathname, (apiRequests.get(requestUrl.pathname) ?? 0) + 1);
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Parking,\s+(under control|bajo control)\.?/i }),
  ).toBeVisible();
  await expect.poll(() => apiRequests.get('/parkings') ?? 0).toBeGreaterThan(0);

  const demoAction = page.getByRole('button', { name: /Probar demo|Try the demo/i }).first();
  await expect(demoAction).toBeVisible();
  await demoAction.click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#overview-title')).toBeVisible();
  await expect.poll(() => apiRequests.get('/demo/login') ?? 0).toBeGreaterThan(0);
  await expect.poll(() => apiRequests.get('/parkings/me') ?? 0).toBeGreaterThan(0);
  await expect.poll(() => apiRequests.get('/analytics/summary') ?? 0).toBeGreaterThan(0);
  expect([...apiOrigins]).toEqual([localApiUrl]);

  console.log(
    `[production-preview] API request inventory: ${JSON.stringify(
      Object.fromEntries(
        [...apiRequests.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    )}`,
  );
});
