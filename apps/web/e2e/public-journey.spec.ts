import { expect, test, type Page, type TestInfo } from '@playwright/test';

import type { components } from '@parkcore/api-client';

type PublicParking = components['schemas']['PublicParkingResponse'];
type User = components['schemas']['UserResponse'];

interface BrowserGlobal {
  document: {
    documentElement: { clientWidth: number; scrollWidth: number };
    querySelectorAll: (selector: string) => ArrayLike<BrowserElement>;
  };
}

interface BrowserElement {
  className: unknown;
  getBoundingClientRect: () => { right: number; width: number };
  id: string;
  tagName: string;
}

const showcaseParking: PublicParking = {
  address: '101 Demo Avenue',
  availabilityState: 'AVAILABLE',
  availableSpaces: 12,
  capacity: 20,
  closesAt: null,
  currency: 'USD',
  description: 'A fictional facility for exploring ParkCore.',
  hourlyRateCents: 1550,
  id: 'showcase-1',
  image: null,
  is24Hours: true,
  isOpen: true,
  isShowcase: true,
  lat: -34.6037,
  lng: -58.3816,
  neighborhood: 'Downtown',
  nextOpeningAt: null,
  occupancyPercent: 40,
  opensAt: null,
  timezone: 'America/Argentina/Buenos_Aires',
  title: 'Showcase Central',
};

const hiddenOwnerParking: PublicParking = {
  ...showcaseParking,
  address: '202 Owner Street',
  description: 'An operational facility that is not part of the public demo.',
  id: 'owner-private-1',
  isShowcase: false,
  title: 'Owner Private Parking',
};

const demoUser: User = {
  createdAt: '2026-08-17T09:00:00.000Z',
  demoExpiresAt: '2026-08-17T13:00:00.000Z',
  email: null,
  id: 'demo-owner-1',
  kind: 'DEMO',
  lastName: 'Demo',
  name: 'ParkCore Demo',
  phone: null,
  photoUrl: null,
  timezone: 'America/Argentina/Buenos_Aires',
  updatedAt: '2026-08-17T09:00:00.000Z',
};

function listResponse(data: PublicParking[]) {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 30,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
  } satisfies components['schemas']['PublicParkingListResponse'];
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const geometry = await page.evaluate(() => {
    const browser = globalThis as unknown as BrowserGlobal;
    const viewportWidth = browser.document.documentElement.clientWidth;
    const overflowing = Array.from(browser.document.querySelectorAll('*'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          className: String(element.className),
          id: element.id,
          right: box.right,
          tagName: element.tagName,
          width: box.width,
        };
      })
      .filter((element) => element.right > viewportWidth + 1)
      .slice(0, 5);
    return {
      clientWidth: viewportWidth,
      overflowing,
      scrollWidth: browser.document.documentElement.scrollWidth,
    };
  });
  expect(
    geometry.scrollWidth,
    `${label} should not overflow horizontally. ${JSON.stringify(geometry.overflowing)}`,
  ).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function captureRoute(
  page: Page,
  testInfo: TestInfo,
  route: { name: string; path: string; ready: () => Promise<void> },
  viewport: string,
  theme: 'dark' | 'light',
) {
  await page.goto(route.path);
  await route.ready();
  await expectNoHorizontalOverflow(page, `${viewport} ${theme} ${route.name}`);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`public-${viewport}-${theme}-${route.name}.png`),
  });
}

async function installApiMock(page: Page) {
  const requests: string[] = [];
  let offlineAttempts = 0;
  let releasePendingRequest: (() => void) | undefined;

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(`${request.method()} ${url.pathname}${url.search}`);

    const respond = async (body: unknown, status = 200) => {
      await route.fulfill({
        body: JSON.stringify(body),
        contentType: 'application/json',
        status,
      });
    };

    if (request.method() === 'GET' && url.pathname === '/parkings') {
      const search = url.searchParams.get('search');
      if (search === 'pending') {
        await new Promise<void>((resolve) => {
          releasePendingRequest = resolve;
        });
      }
      if (search === 'offline' && offlineAttempts++ < 4) {
        await respond({ error: true, message: 'Simulated network failure.' }, 503);
        return;
      }
      await respond(listResponse(search === 'empty' ? [] : [showcaseParking]));
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/parkings/showcase-1') {
      await respond(showcaseParking);
      return;
    }

    if (request.method() === 'POST' && url.pathname === '/demo/login') {
      await respond({ accessToken: 'isolated-demo-token', user: demoUser });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/parkings/me') {
      await respond([]);
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/analytics/summary') {
      await respond({
        activeVehicles: 0,
        completedToday: 0,
        facilities: [],
        occupancyPercent: 0,
        revenueToday: [],
        totalCapacity: 0,
      });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/analytics/revenue') {
      await respond({ data: [], days: Number(url.searchParams.get('days') ?? 7) });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/analytics/volume') {
      await respond({ data: [], days: Number(url.searchParams.get('days') ?? 7) });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/users/me') {
      await respond(demoUser);
      return;
    }

    await respond(
      { error: true, message: `Unexpected request: ${request.method()} ${url.pathname}` },
      404,
    );
  });

  return {
    releasePendingRequest: () => {
      releasePendingRequest?.();
      releasePendingRequest = undefined;
    },
    requests,
  };
}

test('walks the public discovery, estimate, and demo entry journey', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(30_000);

  const api = await installApiMock(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('parkcore-lang')) localStorage.setItem('parkcore-lang', 'en-US');
    if (!localStorage.getItem('parkcore-theme')) localStorage.setItem('parkcore-theme', 'light');
  });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');

  const viewports = [
    { height: 844, name: 'compact', width: 390 },
    { height: 1024, name: 'medium', width: 768 },
    { height: 900, name: 'wide', width: 1280 },
  ] as const;

  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((nextTheme) => {
      localStorage.setItem('parkcore-theme', nextTheme);
    }, theme);

    for (const viewport of viewports) {
      await page.setViewportSize({ height: viewport.height, width: viewport.width });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
      await expect(page.getByRole('heading', { name: 'Parking, under control.' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Estimate a stay' })).toBeVisible();
      await expect(page.getByText('Demonstration data', { exact: true })).toBeVisible();
      await expect(
        page.getByText('This is not real-time activity.', { exact: true }),
      ).toBeVisible();
      await expect(page.getByText('$31.00', { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page, `${viewport.name} ${theme} landing`);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`public-${viewport.name}-${theme}-landing.png`),
      });

      await captureRoute(
        page,
        testInfo,
        {
          name: 'directory',
          path: '/parkings',
          ready: async () => {
            await expect(
              page.getByRole('heading', {
                name: 'Facilities you can understand before you arrive.',
              }),
            ).toBeVisible();
            await expect(page.getByRole('link', { name: 'Open Showcase Central' })).toBeVisible();
            await expect(page.getByText(hiddenOwnerParking.title, { exact: true })).toBeHidden();
          },
        },
        viewport.name,
        theme,
      );

      await captureRoute(
        page,
        testInfo,
        {
          name: 'detail',
          path: '/parkings/showcase-1',
          ready: async () => {
            await expect(page.getByRole('heading', { name: 'Showcase Central' })).toBeVisible();
            await expect(
              page.getByText('Fictional parking with demonstration data for exploring ParkCore.', {
                exact: true,
              }),
            ).toBeVisible();
            await expect(page.getByText('Available', { exact: true })).toBeVisible();
            const directions = page.getByRole('link', {
              name: 'Get directions to Showcase Central',
            });
            await expect(directions).toHaveAttribute(
              'href',
              'https://www.google.com/maps/dir/?api=1&destination=-34.6037,-58.3816',
            );
            await expect(directions).toHaveAttribute('target', '_blank');
            await expect(directions).toHaveAttribute('rel', 'noopener noreferrer');
            await expect(
              page.getByRole('img', { name: 'Parking image not available' }),
            ).toBeVisible();
          },
        },
        viewport.name,
        theme,
      );

      await captureRoute(
        page,
        testInfo,
        {
          name: 'login',
          path: '/login?returnTo=%2Fapp%2Fparkings',
          ready: async () => {
            await expect(
              page.getByRole('heading', { name: 'Return to your facility.' }),
            ).toBeVisible();
            await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
            await expect(page.getByRole('textbox', { name: 'Password' })).toHaveAttribute(
              'autocomplete',
              'current-password',
            );
            await expect(
              page.getByRole('link', { name: 'Create an owner account' }),
            ).toHaveAttribute('href', '/register?returnTo=%2Fapp%2Fparkings');
          },
        },
        viewport.name,
        theme,
      );

      await captureRoute(
        page,
        testInfo,
        {
          name: 'registration',
          path: '/register?returnTo=%2Fapp%2Fparkings',
          ready: async () => {
            await expect(page.getByRole('heading', { name: 'Create your account.' })).toBeVisible();
            await expect(page.getByLabel('First name')).toHaveAttribute('autocomplete', 'name');
            await expect(page.getByLabel('Last name')).toHaveAttribute(
              'autocomplete',
              'family-name',
            );
            await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
            await expect(page.getByRole('textbox', { name: 'Password' })).toHaveAttribute(
              'autocomplete',
              'new-password',
            );
            await expect(page.getByText('Use 8 to 100 characters.', { exact: true })).toBeVisible();
          },
        },
        viewport.name,
        theme,
      );

      await captureRoute(
        page,
        testInfo,
        {
          name: 'not-found',
          path: '/not-a-public-route',
          ready: async () => {
            await expect(
              page.getByRole('heading', { name: 'There is no parking here.' }),
            ).toBeVisible();
            await expect(page.getByRole('link', { name: 'Explore facilities' })).toHaveAttribute(
              'href',
              '/parkings',
            );
            await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
          },
        },
        viewport.name,
        theme,
      );
    }
  }

  await page.setViewportSize({ height: 900, width: 1280 });
  await page.evaluate(() => {
    localStorage.setItem('parkcore-theme', 'light');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.getByLabel('Duration in minutes').fill('90');
  await expect(page.getByText('90 minutes', { exact: true })).toBeVisible();
  await expect(page.getByText('$31.00', { exact: true })).toBeVisible();

  await page.goto('/parkings');
  await page.getByLabel('Where are you going?').fill('central');
  await page.getByLabel('Currency').selectOption('USD');
  await page.getByLabel('Min. rate (USD)').fill('10');
  await page.getByLabel('Max. rate (USD)').fill('20');
  await page.getByLabel('Available now').check();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(
    /\/parkings\?search=central&currency=USD&minRate=10\.00&maxRate=20\.00&availableNow=true$/,
  );
  await expect(page.getByRole('link', { name: 'Open Showcase Central' })).toBeVisible();
  expect(
    api.requests.some(
      (request) =>
        request.startsWith('GET /parkings?') &&
        request.includes('search=central') &&
        request.includes('currency=USD') &&
        request.includes('minHourlyRateCents=1000') &&
        request.includes('maxHourlyRateCents=2000') &&
        request.includes('availableNow=true'),
    ),
  ).toBe(true);

  await page.getByLabel('Min. rate (USD)').fill('20');
  await page.getByLabel('Max. rate (USD)').fill('10');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('alert')).toContainText('Minimum rate cannot exceed maximum rate.');

  await page.goto('/parkings?search=pending');
  await expect(page.getByLabel('Loading parkings')).toBeVisible();
  api.releasePendingRequest();
  await expect(page.getByRole('link', { name: 'Open Showcase Central' })).toBeVisible();

  await page.goto('/parkings?search=empty');
  await expect(page.getByRole('status', { name: 'No active parkings' })).toBeVisible();

  await page.goto('/parkings?search=offline');
  await expect(page.getByRole('alert')).toContainText('We could not load the directory', {
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: 'Open Showcase Central' })).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/parkings');
  const filterTrigger = page.getByRole('button', { name: 'Filter facilities' });
  await filterTrigger.click();
  const filterDialog = page.getByRole('dialog', { name: 'Filter facilities' });
  await expect(filterDialog).toBeVisible();
  await expect(filterDialog.getByRole('button', { name: 'Close Filter facilities' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(filterDialog).toBeHidden();
  await expect(filterTrigger).toBeFocused();

  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto('/register?returnTo=%2Fapp%2Fparkings');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByRole('textbox', { name: 'Password' })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(page.getByRole('textbox', { name: 'Password' })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Spanish' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
  await expect(page.getByRole('heading', { name: 'Creá tu cuenta.' })).toBeVisible();
  await page.getByRole('button', { name: 'Inglés' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

  await page.goto('/login?returnTo=%2Fapp');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await expectNoHorizontalOverflow(page, 'reduced-motion login');

  await page.setViewportSize({ height: 900, width: 640 });
  await page.goto('/login?returnTo=%2Fapp');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expectNoHorizontalOverflow(page, '200 percent zoom equivalent login viewport');

  await page.goto('/');
  const demoButton = page.getByRole('button', { name: 'Explore the demo', exact: true }).first();
  await demoButton.click();
  await expect(page).toHaveURL(/\/app$/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('parkcore.access-token')))
    .toBe('isolated-demo-token');
  expect(api.requests.some((request) => request === 'POST /demo/login')).toBe(true);
});
