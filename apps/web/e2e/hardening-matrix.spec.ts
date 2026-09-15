import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type Route } from '@playwright/test';

import type { components } from '@parkcore/api-client';

type Parking = components['schemas']['ParkingResponse'];
type PublicParking = components['schemas']['PublicParkingResponse'];
type ParkingSession = components['schemas']['ParkingSessionResponse'];
type User = components['schemas']['UserResponse'];
type Locale = 'es-AR' | 'en-US';
type Theme = 'dark' | 'light';
type Scenario = 'blocked' | 'degraded' | 'empty' | 'error' | 'loading' | 'success';

const VIEWPORTS = [
  { height: 800, name: '360px', width: 360 },
  { height: 844, name: '390px', width: 390 },
  { height: 1024, name: '768px', width: 768 },
  { height: 900, name: '1024px', width: 1024 },
  { height: 900, name: '1280px', width: 1280 },
  { height: 960, name: '1440px', width: 1440 },
] as const;

const A11Y_VIEWPORTS = [VIEWPORTS[1], VIEWPORTS[5]] as const;

interface RouteFixture {
  name: string;
  path: string;
  shell: 'owner' | 'public';
}

const landingRoute = { name: 'landing', path: '/', shell: 'public' } as const;
const catalogRoute = { name: 'catalog', path: '/parkings', shell: 'public' } as const;
const detailRoute = { name: 'detail', path: '/parkings/parking-1', shell: 'public' } as const;
const loginRoute = { name: 'login', path: '/login', shell: 'public' } as const;
const registerRoute = { name: 'register', path: '/register', shell: 'public' } as const;
const overviewRoute = { name: 'overview', path: '/app', shell: 'owner' } as const;
const ownerParkingsRoute = {
  name: 'owner-parkings',
  path: '/app/parkings',
  shell: 'owner',
} as const;
const createParkingRoute = {
  name: 'create-parking',
  path: '/app/parkings/new',
  shell: 'owner',
} as const;
const ownerParkingRoute = {
  name: 'owner-parking',
  path: '/app/parkings/parking-1',
  shell: 'owner',
} as const;
const editParkingRoute = {
  name: 'edit-parking',
  path: '/app/parkings/parking-1/edit',
  shell: 'owner',
} as const;
const historyRoute = {
  name: 'history',
  path: '/app/parkings/parking-1/sessions',
  shell: 'owner',
} as const;
const sessionRoute = {
  name: 'session',
  path: '/app/sessions/session-1',
  shell: 'owner',
} as const;
const profileRoute = { name: 'profile', path: '/app/profile', shell: 'owner' } as const;
const publicNotFoundRoute = {
  name: 'public-not-found',
  path: '/hardening-public-not-found',
  shell: 'public',
} as const;
const ownerNotFoundRoute = {
  name: 'owner-not-found',
  path: '/app/hardening-owner-not-found',
  shell: 'owner',
} as const;

const ROUTES = [
  landingRoute,
  catalogRoute,
  detailRoute,
  loginRoute,
  registerRoute,
  overviewRoute,
  ownerParkingsRoute,
  createParkingRoute,
  ownerParkingRoute,
  editParkingRoute,
  historyRoute,
  sessionRoute,
  profileRoute,
  publicNotFoundRoute,
  ownerNotFoundRoute,
] as const satisfies readonly RouteFixture[];

const owner: User = {
  createdAt: '2026-08-17T09:00:00.000Z',
  demoExpiresAt: null,
  email: 'owner@parkcore.test',
  id: 'owner-1',
  kind: 'OWNER',
  lastName: 'Owner',
  name: 'ParkCore Owner',
  phone: null,
  photoUrl: null,
  timezone: 'America/Argentina/Buenos_Aires',
  updatedAt: '2026-08-17T09:00:00.000Z',
};

const publicParking: PublicParking = {
  address: '101 Demo Avenue',
  availabilityState: 'AVAILABLE',
  availableSpaces: 11,
  capacity: 20,
  closesAt: null,
  currency: 'USD',
  description: 'A fictional facility for exploring ParkCore.',
  hourlyRateCents: 1550,
  id: 'parking-1',
  image: null,
  is24Hours: true,
  isOpen: true,
  isShowcase: true,
  lat: -34.6037,
  lng: -58.3816,
  neighborhood: 'Downtown',
  nextOpeningAt: null,
  occupancyPercent: 45,
  opensAt: null,
  timezone: 'America/Argentina/Buenos_Aires',
  title: 'Showcase Central',
};

const activeSession: ParkingSession = {
  createdAt: '2026-08-17T09:30:00.000Z',
  currency: 'USD',
  customerName: 'Ada Lovelace',
  customerPhone: '+5491100000000',
  endTime: null,
  hourlyRateCents: 1550,
  id: 'session-1',
  notes: 'North entrance.',
  parkingId: 'parking-1',
  startTime: '2026-08-17T09:30:00.000Z',
  status: 'ACTIVE',
  totalAmountCents: null,
  updatedAt: '2026-08-17T09:30:00.000Z',
  vehicle: {
    brand: 'Toyota',
    id: 'vehicle-1',
    model: 'Corolla',
    plate: 'AB123CD',
    type: 'CAR',
  },
  vehicleId: 'vehicle-1',
};

const completedSession: ParkingSession = {
  ...activeSession,
  endTime: '2026-08-17T10:45:00.000Z',
  id: 'session-2',
  status: 'COMPLETED',
  totalAmountCents: 3100,
  updatedAt: '2026-08-17T10:45:00.000Z',
  vehicle: { ...activeSession.vehicle, id: 'vehicle-2', plate: 'CD456EF' },
  vehicleId: 'vehicle-2',
};

const ownerParking: Parking = {
  activeSessionCount: 1,
  address: '101 Demo Avenue',
  availabilityState: 'AVAILABLE',
  availableSpaces: 19,
  capacity: 20,
  closesAt: null,
  createdAt: '2026-08-17T09:00:00.000Z',
  currency: 'USD',
  description: 'Covered operational parking.',
  hourlyRateCents: 1550,
  id: 'parking-1',
  image: null,
  is24Hours: true,
  isActive: true,
  isListed: true,
  isOpen: true,
  lat: -34.6037,
  lng: -58.3816,
  nextOpeningAt: null,
  neighborhood: 'Downtown',
  opensAt: null,
  occupancyPercent: 5,
  ownerId: 'owner-1',
  timezone: 'America/Argentina/Buenos_Aires',
  title: 'Central Parking',
  updatedAt: '2026-08-17T09:00:00.000Z',
};

const analyticsSummary: components['schemas']['AnalyticsSummaryResponse'] = {
  activeVehicles: 1,
  completedToday: 2,
  facilities: [
    {
      activeVehicles: 1,
      capacity: 20,
      completedSessions: 2,
      currency: 'USD',
      isActive: true,
      occupancyPercent: 5,
      parkingId: 'parking-1',
      revenueCents: 3100,
      title: 'Central Parking',
    },
  ],
  occupancyPercent: 5,
  revenueToday: [{ currency: 'USD', revenueCents: 3100 }],
  totalCapacity: 20,
};

const analyticsRevenue: components['schemas']['AnalyticsRevenueResponse'] = {
  data: [
    {
      date: '2026-08-16',
      revenueByCurrency: [{ currency: 'USD', revenueCents: 1800 }],
    },
    {
      date: '2026-08-17',
      revenueByCurrency: [{ currency: 'USD', revenueCents: 3100 }],
    },
  ],
  days: 7,
};

const analyticsVolume: components['schemas']['AnalyticsVolumeResponse'] = {
  data: [
    { completedSessions: 1, date: '2026-08-16' },
    { completedSessions: 2, date: '2026-08-17' },
  ],
  days: 7,
};

function publicParkingList(data: PublicParking[]) {
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

function sessionList(data: ParkingSession[]) {
  return {
    aggregate: {
      activeSessions: data.filter((session) => session.status === 'ACTIVE').length,
      cancelledSessions: data.filter((session) => session.status === 'CANCELLED').length,
      completedSessions: data.filter((session) => session.status === 'COMPLETED').length,
      revenueByCurrency: [{ currency: 'USD', revenueCents: 3100 }],
      totalSessions: data.length,
    },
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 20,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
    timezone: 'America/Argentina/Buenos_Aires',
  } satisfies components['schemas']['ParkingSessionListResponse'];
}

function blockedParking(): Parking {
  return {
    ...ownerParking,
    activeSessionCount: ownerParking.capacity,
    availabilityState: 'FULL',
    availableSpaces: 0,
    occupancyPercent: 100,
  };
}

async function installHardeningApiMock(page: Page) {
  let scenario: Scenario = 'success';
  let catalogErrorAttempts = 0;
  let pendingResolvers: (() => void)[] = [];
  const unexpectedRequests: string[] = [];

  const respond = async (route: Route, body: unknown, status = 200) => {
    await route.fulfill({
      body: JSON.stringify(body),
      contentType: 'application/json',
      status,
    });
  };

  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'GET' && url.pathname === '/parkings') {
      const search = url.searchParams.get('search');
      if (search === 'pending' && scenario === 'loading') {
        await new Promise<void>((resolve) => {
          pendingResolvers.push(resolve);
        });
      }
      if (search === 'offline' && scenario === 'error' && catalogErrorAttempts < 4) {
        catalogErrorAttempts += 1;
        await respond(route, { error: true, message: 'Simulated catalog failure.' }, 503);
        return;
      }
      await respond(
        route,
        search === 'empty' ? publicParkingList([]) : publicParkingList([publicParking]),
      );
      return;
    }

    if (method === 'GET' && url.pathname === '/parkings/parking-1') {
      await respond(route, publicParking);
      return;
    }

    if (method === 'GET' && url.pathname === '/users/me') {
      await respond(route, owner);
      return;
    }

    if (method === 'GET' && url.pathname === '/parkings/me') {
      await respond(route, scenario === 'blocked' ? [blockedParking()] : [ownerParking]);
      return;
    }

    if (method === 'GET' && url.pathname === '/parkings/parking-1/sessions/active') {
      await respond(route, [activeSession]);
      return;
    }

    if (method === 'GET' && url.pathname === '/parkings/parking-1/sessions') {
      await respond(route, sessionList([completedSession, activeSession]));
      return;
    }

    if (method === 'GET' && url.pathname === '/sessions/session-1') {
      await respond(route, activeSession);
      return;
    }

    if (method === 'GET' && url.pathname === '/parkings/parking-1/sessions/vehicle-lookup') {
      await respond(route, { vehicle: null });
      return;
    }

    if (method === 'GET' && url.pathname === '/analytics/summary') {
      if (scenario === 'degraded') {
        await respond(route, { error: true, message: 'Simulated analytics failure.' }, 503);
        return;
      }
      await respond(route, analyticsSummary);
      return;
    }

    if (method === 'GET' && url.pathname === '/analytics/revenue') {
      await respond(route, {
        ...analyticsRevenue,
        days: Number(url.searchParams.get('days') ?? 7),
      });
      return;
    }

    if (method === 'GET' && url.pathname === '/analytics/volume') {
      await respond(route, { ...analyticsVolume, days: Number(url.searchParams.get('days') ?? 7) });
      return;
    }

    if (method === 'POST' && url.pathname === '/auth/login') {
      await respond(route, { accessToken: 'hardening-token', user: owner });
      return;
    }

    if (method === 'POST' && url.pathname === '/auth/register') {
      await respond(route, { accessToken: 'hardening-token', user: owner }, 201);
      return;
    }

    if (method === 'POST' && url.pathname === '/demo/login') {
      await respond(route, { accessToken: 'hardening-token', user: owner });
      return;
    }

    unexpectedRequests.push(`${method} ${url.pathname}${url.search}`);
    await respond(
      route,
      { error: true, message: `Unexpected request: ${method} ${url.pathname}` },
      500,
    );
  });

  return {
    releasePending: () => {
      const resolvers = pendingResolvers;
      pendingResolvers = [];
      resolvers.forEach((resolve) => {
        resolve();
      });
    },
    setScenario: (nextScenario: Scenario) => {
      scenario = nextScenario;
      catalogErrorAttempts = 0;
    },
    unexpectedRequests,
  };
}

async function configureBrowserState(
  page: Page,
  state: { authenticated: boolean; locale: Locale; theme: Theme },
) {
  await page.evaluate((nextState) => {
    window.name = `parkcore-hardening:${JSON.stringify(nextState)}`;
  }, state);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const geometry = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const overflowing = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          bottom: box.bottom,
          className: element.className,
          id: element.id,
          left: box.left,
          right: box.right,
          tagName: element.tagName,
          top: box.top,
          width: box.width,
        };
      })
      .filter(
        (element) => element.width > 0 && (element.right > viewportWidth + 1 || element.left < -1),
      )
      .slice(0, 5);

    return {
      clientWidth: viewportWidth,
      overflowing,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(
    geometry.scrollWidth,
    `${label} should not overflow horizontally. ${JSON.stringify(geometry.overflowing)}`,
  ).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function expectMobileNavigationDoesNotCoverContent(page: Page, label: string) {
  const navigation = page.locator('.owner-mobile-nav');
  if ((await navigation.count()) === 0 || !(await navigation.isVisible())) return;

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

  const geometry = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>('.owner-main');
    const mobileNavigation = document.querySelector<HTMLElement>('.owner-mobile-nav');
    if (!main || !mobileNavigation) return null;

    const mainBox = main.getBoundingClientRect();
    const navigationBox = mobileNavigation.getBoundingClientRect();
    const paddingBottom = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
    return {
      contentBottom: mainBox.top + main.scrollHeight - paddingBottom,
      navigationHeight: navigationBox.height,
      navigationTop: navigationBox.top,
      paddingBottom,
    };
  });

  expect(geometry, `${label} should render owner content and mobile navigation.`).not.toBeNull();
  if (!geometry) return;
  expect(
    geometry.paddingBottom,
    `${label} should reserve space for fixed mobile navigation.`,
  ).toBeGreaterThanOrEqual(geometry.navigationHeight - 1);
  expect(
    geometry.contentBottom,
    `${label} content should remain above the mobile navigation at the end of the page.`,
  ).toBeLessThanOrEqual(geometry.navigationTop + 1);
}

async function expectElementWithinViewport(locator: Locator, label: string) {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const viewport = locator.page().viewportSize();
  expect(box, `${label} should have a bounding box.`).not.toBeNull();
  expect(viewport, `${label} should have a configured viewport.`).not.toBeNull();
  if (!box || !viewport) return;

  expect(box.x, `${label} should start inside the viewport.`).toBeGreaterThanOrEqual(-1);
  expect(box.y, `${label} should start inside the viewport.`).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, `${label} should end inside the viewport.`).toBeLessThanOrEqual(
    viewport.width + 1,
  );
  expect(box.y + box.height, `${label} should end inside the viewport.`).toBeLessThanOrEqual(
    viewport.height + 1,
  );
}

async function expectVisibleFocus(locator: Locator, label: string) {
  await locator.focus();
  await expect(locator).toBeFocused();
  await expectElementWithinViewport(locator, label);
  const focusStyle = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
  const hasVisibleFocus =
    (focusStyle.outlineStyle !== 'none' && focusStyle.outlineWidth !== '0px') ||
    focusStyle.boxShadow !== 'none';
  expect(hasVisibleFocus, `${label} should have a visible focus indicator.`).toBe(true);
}

async function visitFixture(
  page: Page,
  route: RouteFixture,
  viewport: (typeof VIEWPORTS)[number],
  locale: Locale,
  theme: Theme,
) {
  await page.setViewportSize({ height: viewport.height, width: viewport.width });
  await configureBrowserState(page, {
    authenticated: route.shell === 'owner',
    locale,
    theme,
  });
  await page.goto(route.path);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expectNoHorizontalOverflow(page, `${viewport.name} ${locale} ${theme} ${route.name}`);
  await expectMobileNavigationDoesNotCoverContent(page, `${viewport.name} ${route.name}`);
}

async function expectOverlayWithinViewport(locator: Locator, label: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const viewport = locator.page().viewportSize();
  expect(box, `${label} should have a bounding box.`).not.toBeNull();
  expect(viewport, `${label} should have a configured viewport.`).not.toBeNull();
  if (!box || !viewport) return;

  expect(box.x, `${label} should not leave the left viewport edge.`).toBeGreaterThanOrEqual(-1);
  expect(box.y, `${label} should not leave the top viewport edge.`).toBeGreaterThanOrEqual(-1);
  expect(
    box.x + box.width,
    `${label} should not leave the right viewport edge.`,
  ).toBeLessThanOrEqual(viewport.width + 1);
  expect(
    box.y + box.height,
    `${label} should not leave the bottom viewport edge.`,
  ).toBeLessThanOrEqual(viewport.height + 1);
}

async function openAndCloseOverlay(page: Page, trigger: Locator, label: string) {
  await expect(trigger).toBeVisible();
  await trigger.click();
  const overlay = page.getByRole('dialog').last();
  await expectOverlayWithinViewport(overlay, label);
  await expect(overlay.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
}

async function scanCriticalAccessibility(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .include('body')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const diagnostic = blockingViolations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join('; ');
      return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}. Targets: ${targets}`;
    })
    .join('\n');
  expect(
    blockingViolations,
    `${label} has blocking accessibility violations.\n${diagnostic}`,
  ).toEqual([]);
}

async function installInitStateScript(page: Page) {
  await page.addInitScript(() => {
    const prefix = 'parkcore-hardening:';
    if (!window.name.startsWith(prefix)) return;
    try {
      const state = JSON.parse(window.name.slice(prefix.length)) as {
        authenticated: boolean;
        locale: Locale;
        theme: Theme;
      };
      localStorage.setItem('parkcore-lang', state.locale);
      localStorage.setItem('parkcore-theme', state.theme);
      if (state.authenticated) localStorage.setItem('parkcore.access-token', 'hardening-token');
      else localStorage.removeItem('parkcore.access-token');
    } catch {
      window.name = '';
    }
  });
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(10_000);
  page.setDefaultNavigationTimeout(30_000);
  await installInitStateScript(page);
});

test('opens every P0 and P1 route in both shells and locales at authored viewports', async ({
  page,
}) => {
  test.setTimeout(420_000);
  const api = await installHardeningApiMock(page);

  for (const locale of ['es-AR', 'en-US'] as const) {
    for (const route of ROUTES) {
      for (const viewport of VIEWPORTS) {
        await test.step(`${route.name} ${locale} ${viewport.name}`, async () => {
          await visitFixture(page, route, viewport, locale, 'light');
        });
      }
    }
  }

  expect(api.unexpectedRequests).toEqual([]);
});

test('passes the serious and critical axe gate across route, shell, locale, and theme fixtures', async ({
  page,
}) => {
  test.setTimeout(420_000);
  const api = await installHardeningApiMock(page);

  for (const locale of ['es-AR', 'en-US'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      for (const viewport of A11Y_VIEWPORTS) {
        for (const route of ROUTES) {
          await test.step(`${route.name} ${locale} ${theme} ${viewport.name}`, async () => {
            await visitFixture(page, route, viewport, locale, theme);
            await scanCriticalAccessibility(
              page,
              `${route.name} ${locale} ${theme} ${viewport.name}`,
            );
          });
        }
      }
    }
  }

  expect(api.unexpectedRequests).toEqual([]);
});

test('keeps focus, compact overlays, and fixed navigation inside the viewport', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const api = await installHardeningApiMock(page);

  for (const locale of ['es-AR', 'en-US'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      await test.step(`public shell ${locale} ${theme}`, async () => {
        await visitFixture(page, landingRoute, VIEWPORTS[0], locale, theme);
        const firstInteractive = page
          .locator(
            'main a[href], main button:not([disabled]), main input:not([disabled]):not([type="hidden"]), main select:not([disabled]), main textarea:not([disabled])',
          )
          .first();
        await expectVisibleFocus(firstInteractive, `landing ${locale} ${theme} focus`);
        await openAndCloseOverlay(
          page,
          page.getByRole('button', { name: /open navigation|abrir navegaci/i }),
          `public navigation ${locale} ${theme}`,
        );
      });

      await test.step(`catalog sheet ${locale} ${theme}`, async () => {
        await visitFixture(page, catalogRoute, VIEWPORTS[0], locale, theme);
        await openAndCloseOverlay(
          page,
          page.getByRole('button', { name: /filter facilities|filtrar/i }),
          `catalog filter sheet ${locale} ${theme}`,
        );
      });

      await test.step(`owner sheet ${locale} ${theme}`, async () => {
        await visitFixture(page, ownerParkingRoute, VIEWPORTS[0], locale, theme);
        await openAndCloseOverlay(
          page,
          page.getByRole('button', { name: /check in$|^ingresar$/i }).first(),
          `check-in sheet ${locale} ${theme}`,
        );
      });

      await test.step(`owner dialog ${locale} ${theme}`, async () => {
        await visitFixture(page, sessionRoute, VIEWPORTS[0], locale, theme);
        await openAndCloseOverlay(
          page,
          page.getByRole('button', { name: /check out|cobrar|finalizar/i }).first(),
          `checkout dialog ${locale} ${theme}`,
        );
      });
    }
  }

  expect(api.unexpectedRequests).toEqual([]);
});

test('covers deterministic loading, empty, error, blocked, and degraded states', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const api = await installHardeningApiMock(page);

  await page.setViewportSize({ height: VIEWPORTS[1].height, width: VIEWPORTS[1].width });
  await configureBrowserState(page, { authenticated: false, locale: 'en-US', theme: 'light' });

  api.setScenario('loading');
  await page.goto('/parkings?search=pending');
  await expect(
    page.locator('[aria-label*="loading" i], [aria-label*="cargand" i]').first(),
  ).toBeVisible();
  api.releasePending();
  await expect(page.locator('a[href="/parkings/parking-1"]').first()).toBeVisible();

  api.setScenario('empty');
  await page.goto('/parkings?search=empty');
  await expect(page.locator('[data-slot="empty-state"]')).toBeVisible();

  api.setScenario('error');
  await page.goto('/parkings?search=offline');
  const catalogError = page.locator('[data-slot="error-state"]');
  await expect(catalogError).toBeVisible({ timeout: 20_000 });
  api.setScenario('success');
  await catalogError.getByRole('button').click();
  await expect(page.locator('a[href="/parkings/parking-1"]').first()).toBeVisible();

  api.setScenario('blocked');
  await configureBrowserState(page, { authenticated: true, locale: 'en-US', theme: 'light' });
  await page.goto(ownerParkingRoute.path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /check in$|^ingresar$/i }).first()).toBeDisabled();

  api.setScenario('degraded');
  await page.goto(overviewRoute.path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 20_000 });

  expect(api.unexpectedRequests).toEqual([]);
});
