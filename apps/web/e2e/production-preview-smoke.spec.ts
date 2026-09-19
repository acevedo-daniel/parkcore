import { expect, test, type Page } from '@playwright/test';

const localApiUrl = 'http://localhost:3000';

interface ThemeBootstrapObservation {
  colorScheme: string;
  theme: string | null;
  themeColor: string | null;
}

interface BrowserWithThemeBootstrap extends Window {
  __parkcoreThemeBootstrapObservations?: ThemeBootstrapObservation[];
}

async function expectLoadedImage(image: ReturnType<Page['locator']>, label: string) {
  await expect(image, label).toBeVisible();
  await expect
    .poll(
      () =>
        image.evaluate((element) => {
          const imageElement = element as HTMLImageElement;
          return imageElement.complete && imageElement.naturalWidth > 0;
        }),
      { message: `${label} should finish loading` },
    )
    .toBe(true);
}

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
    page.getByRole('heading', {
      name: /Parking with clear information|Estacionar con información clara/i,
    }),
  ).toBeVisible();
  await expect.poll(() => apiRequests.get('/parkings') ?? 0).toBeGreaterThan(0);

  const landingImage = page.locator('img[src^="/assets/canonical/"]').first();
  await landingImage.scrollIntoViewIfNeeded();
  await expectLoadedImage(landingImage, 'landing canonical image');
  await expect(landingImage).toHaveAttribute('loading', 'lazy');
  const landingImageSlot = await landingImage.evaluate((element) => {
    const parent = element.parentElement;
    if (!parent) return 0;
    const bounds = parent.getBoundingClientRect();
    return bounds.width / bounds.height;
  });
  expect(landingImageSlot).toBeCloseTo(4 / 3, 2);

  const detailPath = await page
    .getByRole('link', { name: /Open|Abrir/ })
    .first()
    .getAttribute('href');
  if (!detailPath) throw new Error('Missing public detail link in production preview.');
  await page.goto(detailPath);
  await expect(page.locator('img[src^="/assets/canonical/"]').first()).toBeVisible();
  const detailImage = page.locator('img[src^="/assets/canonical/"]').first();
  await expectLoadedImage(detailImage, 'detail canonical image');
  await expect(detailImage).toHaveAttribute('loading', 'eager');
  await expect(detailImage).toHaveAttribute('fetchpriority', 'high');
  const detailImageSlot = await detailImage.evaluate((element) => {
    const parent = element.parentElement;
    if (!parent) return 0;
    const bounds = parent.getBoundingClientRect();
    return bounds.width / bounds.height;
  });
  expect(detailImageSlot).toBeCloseTo(16 / 10, 2);

  const demoAction = page.getByRole('button', { name: /Probar demo|Try the demo/i }).first();
  await expect(demoAction).toBeVisible();
  await demoAction.click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#overview-title')).toBeVisible();
  await expect.poll(() => apiRequests.get('/demo/login') ?? 0).toBeGreaterThan(0);
  await expect.poll(() => apiRequests.get('/parkings/me') ?? 0).toBeGreaterThan(0);
  await expect.poll(() => apiRequests.get('/analytics/summary') ?? 0).toBeGreaterThan(0);
  expect([...apiOrigins]).toEqual([localApiUrl]);

  await page.route('https://example.com/parkcore-invalid-image.svg', async (route) => {
    await route.abort();
  });
  await page.goto('/app/parkings/new');
  await expect(page.getByRole('heading', { name: /Create|Crear/ })).toBeVisible();
  await page
    .getByLabel(/image url|url de la imagen/i)
    .fill('https://example.com/parkcore-invalid-image.svg');
  await expect(page.getByRole('status')).toContainText(
    /could not load this image|no pudimos cargar esta imagen/i,
  );

  console.log(
    `[production-preview] API request inventory: ${JSON.stringify(
      Object.fromEntries(
        [...apiRequests.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
    )}`,
  );
});

test('applies stored and system themes before the app mounts', async ({ page }) => {
  await page.addInitScript(() => {
    const observations: ThemeBootstrapObservation[] = [];
    const browser = window as BrowserWithThemeBootstrap;
    browser.__parkcoreThemeBootstrapObservations = observations;

    const record = () => {
      const theme = document.documentElement.dataset.theme ?? null;
      if (!theme) return;
      observations.push({
        colorScheme: document.documentElement.style.colorScheme,
        theme,
        themeColor:
          document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
      });
    };

    const observer = new MutationObserver(record);
    observer.observe(document, {
      attributeFilter: ['content', 'data-theme', 'style'],
      attributes: true,
      subtree: true,
    });
  });

  const cases = [
    { preference: 'light', systemDark: true, theme: 'light' },
    { preference: 'dark', systemDark: false, theme: 'dark' },
    { preference: 'system', systemDark: false, theme: 'light' },
    { preference: 'system', systemDark: true, theme: 'dark' },
  ] as const;

  for (const appearance of cases) {
    await page.emulateMedia({ colorScheme: appearance.systemDark ? 'dark' : 'light' });
    await page.goto('/');
    await page.evaluate((preference) => {
      localStorage.setItem('parkcore-theme', preference);
      localStorage.setItem('parkcore-lang', 'en-US');
    }, appearance.preference);
    await page.reload();

    const observed = await page.evaluate(() => {
      const browser = window as BrowserWithThemeBootstrap;
      const root = document.documentElement;
      return {
        bootstrap: browser.__parkcoreThemeBootstrapObservations?.[0] ?? null,
        canvas: getComputedStyle(root).getPropertyValue('--canvas').trim(),
        colorScheme: root.style.colorScheme,
        metaThemeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        theme: root.dataset.theme,
      };
    });

    const expectedColor = appearance.theme === 'dark' ? '#111310' : '#f7f7f4';
    expect(observed.bootstrap).toEqual({
      colorScheme: appearance.theme,
      theme: appearance.theme,
      themeColor: expectedColor,
    });
    expect(observed).toMatchObject({
      canvas: expectedColor,
      colorScheme: appearance.theme,
      metaThemeColor: expectedColor,
      theme: appearance.theme,
    });
    await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue(appearance.preference);
  }
});
