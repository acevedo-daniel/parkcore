import { expect, test, type Locator, type Page } from '@playwright/test';

const viewports = [
  { name: '360px', width: 360, height: 800 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 900 },
  { name: '1280px', width: 1280, height: 900 },
  { name: '1440px', width: 1440, height: 960 },
] as const;

interface BrowserGlobal {
  document: {
    documentElement: { clientWidth: number; scrollHeight: number; scrollWidth: number };
    querySelector: (selector: string) => {
      getBoundingClientRect: () => { bottom: number; top: number };
    } | null;
  };
  scrollTo: (x: number, y: number) => void;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const browser = globalThis as unknown as BrowserGlobal;
          return {
            clientWidth: browser.document.documentElement.clientWidth,
            scrollWidth: browser.document.documentElement.scrollWidth,
          };
        }),
      { message: `${label} should not overflow horizontally.` },
    )
    .toEqual(expect.objectContaining({ scrollWidth: expect.any(Number) }));

  const { clientWidth, scrollWidth } = await page.evaluate(() => {
    const browser = globalThis as unknown as BrowserGlobal;
    return {
      clientWidth: browser.document.documentElement.clientWidth,
      scrollWidth: browser.document.documentElement.scrollWidth,
    };
  });
  expect(scrollWidth, `${label} should not overflow horizontally.`).toBeLessThanOrEqual(
    clientWidth + 1,
  );
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
  expect(box.x + box.width, `${label} should end inside the viewport.`).toBeLessThanOrEqual(
    viewport.width + 1,
  );
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

async function expectMobileNavigationDoesNotCoverContent(page: Page, label: string) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width >= 768) return;

  const mobileNavigation = page.getByRole('navigation', { name: 'Owner mobile navigation' });
  if ((await mobileNavigation.count()) === 0) return;
  await expect(mobileNavigation).toBeVisible();
  await page.evaluate(() => {
    const browser = globalThis as unknown as BrowserGlobal;
    browser.scrollTo(0, browser.document.documentElement.scrollHeight);
  });

  const geometry = await page.evaluate(() => {
    const browser = globalThis as unknown as BrowserGlobal;
    const navigation = browser.document.querySelector('.owner-mobile-nav');
    const main = browser.document.querySelector('.owner-main');
    if (!navigation || !main) return null;
    return {
      mainBottom: main.getBoundingClientRect().bottom,
      navigationTop: navigation.getBoundingClientRect().top,
    };
  });
  expect(geometry, `${label} should render owner content and navigation.`).not.toBeNull();
  if (!geometry) return;
  expect(
    geometry.mainBottom,
    `${label} content should remain above the mobile navigation at the end of the page.`,
  ).toBeLessThanOrEqual(geometry.navigationTop + 1);
}

async function visit(page: Page, path: string, ready: Locator, label: string) {
  await page.goto(path);
  await expect(ready).toBeVisible();
  await expectNoHorizontalOverflow(page, label);
  await expectMobileNavigationDoesNotCoverContent(page, label);
}

test('keeps the deployed public and owner surfaces usable at production viewports', async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);

  const timestamp = Date.now();
  const runId = Math.floor(timestamp / 1000)
    .toString(36)
    .toUpperCase();
  const email = `responsive-qa-${runId}-${String(timestamp)}@example.com`;
  const title = `Responsive QA ${runId}`;
  const plate = `RQ${runId}`;
  let apiBaseUrl = '';
  let parkingId = '';
  let sessionId = '';
  let token = '';

  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/register');
    await page.getByLabel('Name (optional)').fill('Responsive Production QA');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('ParkCoreResponsiveQA!');
    const registerResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/auth/register') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create account' }).click();
    apiBaseUrl = new URL((await registerResponse).url()).origin;
    await expect(page).toHaveURL(/\/app$/);

    await page.goto('/app/parkings/new');
    await page.getByLabel('Name').fill(title);
    await page.getByLabel('Address').fill('513 Responsive QA Avenue');
    await page.getByLabel('Latitude').fill('-34.61');
    await page.getByLabel('Longitude').fill('-58.38');
    await page.getByLabel('Capacity').fill('3');
    await page.getByLabel('Hourly rate (USD)').fill('12.34');
    await page.getByRole('button', { name: 'Create parking' }).click();
    await expect(page).toHaveURL(/\/app\/parkings\/[0-9a-f-]{36}$/i);
    const parkingMatch = /\/app\/parkings\/([0-9a-f-]{36})$/i.exec(page.url());
    if (!parkingMatch) throw new Error('Created parking URL did not include an ID.');
    parkingId = parkingMatch[1];

    await page.getByRole('button', { name: 'Check in', exact: true }).click();
    await page.getByLabel('Plate').fill(plate);
    await page.getByLabel('Type').selectOption('CAR');
    await page.getByRole('button', { name: 'Start session' }).click();
    const sessionLink = page.getByRole('link', { name: `Open session for ${plate}` });
    await expect(sessionLink).toBeVisible();
    const sessionHref = await sessionLink.getAttribute('href');
    const sessionMatch = /\/app\/sessions\/([0-9a-f-]{36})$/i.exec(sessionHref ?? '');
    if (!sessionMatch) throw new Error('Created session link did not include an ID.');
    sessionId = sessionMatch[1];

    token = await page.evaluate(() => localStorage.getItem('parkcore.access-token') ?? '');

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const prefix = `${viewport.name}:`;

      await visit(
        page,
        '/',
        page.getByRole('heading', { name: /Parking,\s*under control/i }),
        `${prefix} landing`,
      );
      if (viewport.width < 768) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        const menu = page.getByRole('dialog');
        await expectOverlayWithinViewport(menu, `${prefix} public menu`);
        await page.getByRole('button', { name: 'Close navigation' }).click();
      }
      if (viewport.width === 360) {
        await page.screenshot({
          path: testInfo.outputPath('responsive-public-360.png'),
          fullPage: true,
        });
      }
      await visit(
        page,
        '/parkings',
        page.getByRole('heading', { name: 'Parkings' }),
        `${prefix} catalog`,
      );
      await visit(
        page,
        `/parkings/${parkingId}`,
        page.getByText(title, { exact: true }),
        `${prefix} public detail`,
      );
      await page.evaluate(() => {
        localStorage.removeItem('parkcore.access-token');
      });
      await visit(page, '/login', page.getByLabel('Email'), `${prefix} login`);
      await visit(page, '/register', page.getByLabel('Name (optional)'), `${prefix} register`);
      await visit(
        page,
        '/not-a-route',
        page.getByRole('heading', { name: /No parking/i }),
        `${prefix} public 404`,
      );

      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('ParkCoreResponsiveQA!');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/app$/);
      token = await page.evaluate(() => localStorage.getItem('parkcore.access-token') ?? '');

      await visit(
        page,
        '/app',
        page.getByRole('heading', { name: 'Current facilities' }),
        `${prefix} owner overview`,
      );
      if (viewport.width === 1440) {
        await page.screenshot({
          path: testInfo.outputPath('responsive-owner-1440.png'),
          fullPage: true,
        });
      }
      await visit(
        page,
        '/app/parkings',
        page.getByRole('heading', { name: 'Parkings' }),
        `${prefix} owner parking list`,
      );
      await visit(
        page,
        '/app/parkings/new',
        page.getByRole('heading', { name: 'Create parking' }),
        `${prefix} create form`,
      );
      await expectElementWithinViewport(
        page.getByLabel('Capacity'),
        `${prefix} create capacity field`,
      );
      await expectElementWithinViewport(
        page.getByLabel('Hourly rate (USD)'),
        `${prefix} create rate field`,
      );

      await visit(
        page,
        `/app/parkings/${parkingId}`,
        page.getByRole('button', { name: 'Check in', exact: true }),
        `${prefix} parking overview`,
      );
      await page.getByRole('button', { name: 'Check in', exact: true }).click();
      const checkInSheet = page.getByRole('dialog', { name: 'Check in vehicle' });
      await expectOverlayWithinViewport(checkInSheet, `${prefix} check-in sheet`);
      await page.getByRole('button', { name: 'Close Check in vehicle' }).click();

      await visit(
        page,
        `/app/parkings/${parkingId}/edit`,
        page.getByRole('heading', { name: 'Edit parking' }),
        `${prefix} edit form`,
      );
      await expectElementWithinViewport(
        page.getByLabel('Accept new check-ins'),
        `${prefix} parking status control`,
      );
      await visit(
        page,
        `/app/parkings/${parkingId}/sessions`,
        page.getByRole('heading', { name: 'Session history' }),
        `${prefix} history`,
      );
      await expectElementWithinViewport(
        page.getByRole('navigation', { name: 'Session history pagination' }),
        `${prefix} history pagination`,
      );
      await visit(
        page,
        `/app/sessions/${sessionId}`,
        page.getByRole('button', { name: 'Check out' }),
        `${prefix} session detail`,
      );
      await page.getByRole('button', { name: 'Check out' }).click();
      const checkoutDialog = page.getByRole('dialog', { name: 'Complete checkout' });
      await expectOverlayWithinViewport(checkoutDialog, `${prefix} checkout dialog`);
      await page.getByRole('button', { name: 'Close Complete checkout' }).click();

      await visit(
        page,
        '/app/profile',
        page.getByRole('heading', { name: 'Profile' }),
        `${prefix} profile`,
      );
      await expectElementWithinViewport(page.getByLabel('Email'), `${prefix} profile email field`);
      await visit(
        page,
        '/app/missing',
        page.getByRole('heading', { name: 'Route unavailable' }),
        `${prefix} owner 404`,
      );
    }
  } finally {
    if (apiBaseUrl && token && sessionId) {
      await page.request.patch(`${apiBaseUrl}/sessions/${sessionId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    if (apiBaseUrl && token && parkingId) {
      await page.request.patch(`${apiBaseUrl}/parkings/${parkingId}`, {
        data: { isActive: false },
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }
});
