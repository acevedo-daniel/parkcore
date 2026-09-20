import { expect, test, type Page } from '@playwright/test';

interface ParkingSnapshot {
  id: string;
  title: string;
  address: string;
  hourlyRateCents: number;
  currency: string;
  capacity: number;
  isActive: boolean;
  isListed: boolean;
  timezone: string;
  activeSessionCount: number;
  availableSpaces: number;
  occupancyPercent: number;
  isOpen: boolean;
  availabilityState: string;
  nextOpeningAt: string | null;
}

interface PublicParkingSnapshot {
  id: string;
  title: string;
  isShowcase: boolean;
}

interface PublicParkingListSnapshot {
  data: PublicParkingSnapshot[];
  meta: { total: number };
}

interface VehicleSummary {
  id: string;
  plate: string;
  type: string;
  brand: string | null;
  model: string | null;
}

interface SessionSnapshot {
  id: string;
  startTime: string;
  endTime: string | null;
  hourlyRateCents: number;
  currency: string;
  totalAmountCents: number | null;
  status: string;
  parkingId: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  vehicle: VehicleSummary;
}

interface SessionHistorySnapshot {
  data: SessionSnapshot[];
  aggregate: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    revenueByCurrency: { currency: string; revenueCents: number }[];
  };
  timezone: string;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function readOwnedParking(
  page: Page,
  apiBaseUrl: string,
  accessToken: string,
  title: string,
) {
  const response = await page.request.get(`${apiBaseUrl}/parkings/me`, {
    headers: authHeaders(accessToken),
  });
  expect(response.status()).toBe(200);
  const parkings = (await response.json()) as ParkingSnapshot[];
  const parking = parkings.find((item) => item.title === title);
  if (!parking) throw new Error(`Parking ${title} was not returned by the owner API.`);
  return parking;
}

async function readPublicParkingList(page: Page, apiBaseUrl: string, webOrigin: string) {
  const response = await page.request.get(`${apiBaseUrl}/parkings?limit=10`, {
    headers: { Origin: webOrigin },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()['access-control-allow-origin']).toBe(webOrigin);
  return (await response.json()) as PublicParkingListSnapshot;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const root = (
      globalThis as unknown as {
        document: { documentElement: { clientWidth: number; scrollWidth: number } };
      }
    ).document.documentElement;
    return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth };
  });
  expect(metrics.scrollWidth, `${label} has horizontal overflow`).toBeLessThanOrEqual(
    metrics.clientWidth + 1,
  );
}

async function formatMoney(page: Page, cents: number, currency: string) {
  return page.evaluate(
    ({ cents: amountInCents, currency: currencyCode }) =>
      new Intl.NumberFormat('en-US', {
        currency: currencyCode,
        style: 'currency',
      }).format(amountInCents / 100),
    { cents, currency },
  );
}

async function formatParkingTime(page: Page, value: string, timezone: string) {
  return page.evaluate(
    ({ timestamp, timeZone }) =>
      new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        timeZone,
      }).format(new Date(timestamp)),
    { timestamp: value, timeZone: timezone },
  );
}

function sessionIdFromHref(href: string | null) {
  const match = href?.match(/^\/app\/sessions\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error(`Session link did not include a UUID: ${href ?? 'missing href'}`);
  return match[1];
}

test('proves the isolated canonical demo stay journey', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`,
    );
  });
  await page.addInitScript(() => {
    localStorage.setItem('parkcore-lang', 'en');
    localStorage.setItem('parkcore-theme', 'light');
  });
  await page.setViewportSize({ height: 960, width: 1440 });
  await page.goto('/');
  const publicAppearance = page.locator('.public-header-tools [data-slot="appearance-controls"]');
  await expect(
    page.getByRole('heading', { exact: true, name: 'Parking with clear information.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await publicAppearance.getByRole('combobox', { name: 'Theme' }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await publicAppearance.getByRole('button', { exact: true, name: 'Spanish' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
  await expect(publicAppearance.getByRole('button', { exact: true, name: /Ingl/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await publicAppearance.getByRole('button', { exact: true, name: /Ingl/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await publicAppearance.getByRole('combobox', { name: 'Theme' }).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto('/parkings');
  await expect(
    page.getByRole('heading', { exact: true, name: 'Facilities with clear information.' }),
  ).toBeVisible();
  const publicResults = page.getByRole('region', { name: 'Parking results' });
  await expect(publicResults).toBeVisible();
  await expect(publicResults.getByText('Demo', { exact: true })).toHaveCount(5);
  await expectNoHorizontalOverflow(page, 'public catalog before demo');

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/login');

  const demoLoginResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/demo/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { exact: true, name: 'Enter the demo' }).click();
  const demoLoginResponse = await demoLoginResponsePromise;
  expect(demoLoginResponse.status()).toBe(200);
  const apiBaseUrl = new URL(demoLoginResponse.url()).origin;
  const demoLogin = (await demoLoginResponse.json()) as {
    accessToken: string;
    user: { kind: string; timezone: string };
  };
  expect(demoLogin.user).toMatchObject({
    kind: 'DEMO',
    timezone: 'America/Argentina/Buenos_Aires',
  });
  const accessToken = demoLogin.accessToken;
  const headers = authHeaders(accessToken);
  const webOrigin = new URL(page.url()).origin;
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(
    page.getByRole('heading', { exact: true, name: 'Operations overview.' }),
  ).toBeVisible();

  const ownerMobileAppearance = page.locator(
    '.owner-mobile-header [data-slot="appearance-controls"]',
  );
  await ownerMobileAppearance.getByRole('button', { exact: true, name: 'Spanish' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
  await ownerMobileAppearance.getByRole('button', { exact: true, name: /Ingl/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

  const publicListingBeforeOperations = await readPublicParkingList(page, apiBaseUrl, webOrigin);
  expect(publicListingBeforeOperations.meta.total).toBe(5);
  expect(publicListingBeforeOperations.data).toHaveLength(5);
  expect(publicListingBeforeOperations.data.every((parking) => parking.isShowcase)).toBe(true);
  expect(JSON.stringify(publicListingBeforeOperations)).not.toMatch(
    /ownerId|customerName|customerPhone|notes/i,
  );

  await page.goto('/parkings');
  await expect(
    page.getByRole('heading', { exact: true, name: 'Facilities with clear information.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Parking results' }).getByText('Demo', { exact: true }),
  ).toHaveCount(5);

  const ownedParkingsResponse = await page.request.get(`${apiBaseUrl}/parkings/me`, { headers });
  expect(ownedParkingsResponse.status()).toBe(200);
  const ownedParkings = (await ownedParkingsResponse.json()) as ParkingSnapshot[];
  expect(ownedParkings).toHaveLength(6);
  const central = ownedParkings.find((parking) => parking.title === 'Central Corrientes');
  const full = ownedParkings.find((parking) => parking.title === 'Recoleta Patio');
  const paused = ownedParkings.find((parking) => parking.title === 'San Telmo Mercado');
  if (!central || !full || !paused) throw new Error('Canonical facilities were not seeded.');

  expect(central).toMatchObject({
    activeSessionCount: 4,
    availableSpaces: 26,
    availabilityState: 'AVAILABLE',
    capacity: 30,
    currency: 'ARS',
    hourlyRateCents: 5500,
    isActive: true,
    isListed: false,
    isOpen: true,
    occupancyPercent: 13.333333333333334,
    timezone: 'America/Argentina/Buenos_Aires',
  });
  expect(full).toMatchObject({
    activeSessionCount: 12,
    availabilityState: 'FULL',
    availableSpaces: 0,
    capacity: 12,
  });
  expect(paused).toMatchObject({
    activeSessionCount: 2,
    availabilityState: 'PAUSED',
    isActive: false,
  });

  const lookupResponse = await page.request.get(
    `${apiBaseUrl}/parkings/${central.id}/sessions/vehicle-lookup?plate=cc-004`,
    { headers },
  );
  expect(lookupResponse.status()).toBe(200);
  const lookup = (await lookupResponse.json()) as { vehicle: VehicleSummary | null };
  expect(lookup.vehicle).toMatchObject({
    plate: 'CC004',
    type: 'CAR',
    brand: 'Volkswagen',
    model: 'Polo',
  });
  expect(JSON.stringify(lookup)).not.toMatch(/customerName|customerPhone|notes|session/i);

  await page.goto('/app/parkings');
  const centralLink = page.getByRole('link', {
    exact: true,
    name: 'Open operations for Central Corrientes',
  });
  await expect(centralLink).toBeVisible();
  await centralLink.click();
  await expect(page).toHaveURL(new RegExp(`/app/parkings/${central.id}$`));
  await expect(page.getByRole('progressbar', { name: /4 of 30 spaces occupied/ })).toBeVisible();
  await expectNoHorizontalOverflow(page, 'compact light operation');
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath('canonical-operation-compact-light.png'),
  });

  const checkInTrigger = page.getByRole('button', { exact: true, name: 'Check in' });
  await checkInTrigger.focus();
  await page.keyboard.press('Enter');
  const checkInSheet = page.getByRole('dialog', { name: 'Check in vehicle' });
  await expect(checkInSheet).toBeVisible();
  await expect(checkInSheet.getByRole('button', { name: 'Close Check in vehicle' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(checkInSheet).toBeHidden();
  await expect(checkInTrigger).toBeFocused();

  await checkInTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(checkInSheet).toBeVisible();
  const plateField = checkInSheet.getByRole('textbox', { exact: true, name: 'Plate' });
  await plateField.fill('cc-004');
  await expect(
    checkInSheet.getByText(
      'A previously registered vehicle was found. Review its details before starting the stay.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(checkInSheet.getByLabel('Type', { exact: true })).toHaveValue('CAR');
  await expect(checkInSheet.getByLabel('Brand', { exact: true })).toHaveValue('Volkswagen');
  await expect(checkInSheet.getByLabel('Model', { exact: true })).toHaveValue('Polo');
  await expect(checkInSheet.getByLabel('Name', { exact: true })).toHaveValue('');
  await expect(checkInSheet.getByLabel('Phone', { exact: true })).toHaveValue('');
  await expect(checkInSheet.getByLabel('Notes', { exact: true })).toHaveValue('');
  await checkInSheet.getByLabel('Name', { exact: true }).fill('Canonical visitor');
  await checkInSheet.getByLabel('Phone', { exact: true }).fill('+5491100000000');
  await checkInSheet.getByLabel('Notes', { exact: true }).fill('Canonical journey check-in');

  const checkInResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/parkings/${central.id}/sessions/check-in`) &&
      response.request().method() === 'POST',
  );
  const startSessionButton = checkInSheet.getByRole('button', { name: 'Start session' });
  await startSessionButton.focus();
  await page.keyboard.press('Enter');
  const checkInResponse = await checkInResponsePromise;
  expect(checkInResponse.status()).toBe(201);
  const checkedIn = (await checkInResponse.json()) as SessionSnapshot;
  expect(checkedIn).toMatchObject({
    currency: 'ARS',
    customerName: 'Canonical visitor',
    customerPhone: '+5491100000000',
    hourlyRateCents: 5500,
    notes: 'Canonical journey check-in',
    parkingId: central.id,
    status: 'ACTIVE',
    totalAmountCents: null,
    vehicle: {
      plate: 'CC004',
      type: 'CAR',
      brand: 'Volkswagen',
      model: 'Polo',
    },
  });
  await expect(checkInSheet).toBeHidden();
  await expect(page.getByText('CC004 checked in.', { exact: true })).toBeVisible();

  await expect
    .poll(
      async () =>
        (await readOwnedParking(page, apiBaseUrl, accessToken, central.title)).activeSessionCount,
    )
    .toBe(5);
  const updatedCentral = await readOwnedParking(page, apiBaseUrl, accessToken, central.title);
  expect(updatedCentral).toMatchObject({
    activeSessionCount: 5,
    availableSpaces: 25,
    availabilityState: 'AVAILABLE',
    capacity: 30,
  });
  expect(updatedCentral.occupancyPercent).toBeCloseTo(16.666666666666668, 10);

  const activeSessionLink = page.getByRole('link', { name: 'Open session for CC004' });
  await expect(activeSessionLink).toBeVisible();
  const sessionId = sessionIdFromHref(await activeSessionLink.getAttribute('href'));
  const activeDetailResponse = await page.request.get(`${apiBaseUrl}/sessions/${sessionId}`, {
    headers,
  });
  expect(activeDetailResponse.status()).toBe(200);
  const activeDetail = (await activeDetailResponse.json()) as SessionSnapshot;
  expect(activeDetail).toMatchObject({
    id: sessionId,
    customerName: 'Canonical visitor',
    customerPhone: '+5491100000000',
    hourlyRateCents: 5500,
    notes: 'Canonical journey check-in',
    parkingId: central.id,
    status: 'ACTIVE',
    vehicle: { plate: 'CC004' },
  });

  await activeSessionLink.click();
  await expect(page).toHaveURL(new RegExp(`/app/sessions/${sessionId}$`));
  await expect(page.getByRole('heading', { name: 'Car', exact: true })).toBeVisible();
  await expect(page.getByText('Central Corrientes', { exact: true })).toBeVisible();
  const checkoutTrigger = page.getByRole('button', { name: 'Check out', exact: true });
  await checkoutTrigger.focus();
  await page.keyboard.press('Enter');
  const checkout = page.getByRole('dialog', { name: 'Complete checkout' });
  await expect(checkout).toBeVisible();
  await expect(checkout.getByLabel('Checkout summary')).toBeVisible();
  await expect(checkout.getByRole('button', { name: 'Close checkout' })).toBeFocused();
  await expect(checkout).toContainText('Estimate');
  await expect(checkout).toContainText(
    await formatMoney(page, central.hourlyRateCents, central.currency),
  );
  await expect(checkout).toContainText('1 hour');
  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/sessions/${sessionId}/check-out`) &&
      response.request().method() === 'POST',
  );
  const completeCheckoutButton = checkout.getByRole('button', {
    exact: true,
    name: 'Complete checkout',
  });
  await completeCheckoutButton.focus();
  await page.keyboard.press('Enter');
  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.status()).toBe(200);
  const completed = (await checkoutResponse.json()) as SessionSnapshot;
  expect(completed).toMatchObject({
    currency: 'ARS',
    customerName: 'Canonical visitor',
    customerPhone: '+5491100000000',
    hourlyRateCents: 5500,
    id: sessionId,
    notes: 'Canonical journey check-in',
    parkingId: central.id,
    status: 'COMPLETED',
    totalAmountCents: 5500,
    vehicle: { plate: 'CC004' },
  });
  expect(completed.endTime).toBeTruthy();
  await expect(checkout).toBeHidden();
  await expect(page.getByText('Session checked out.', { exact: true })).toBeVisible();

  const expectedTotal = await formatMoney(
    page,
    completed.totalAmountCents ?? 0,
    completed.currency,
  );
  const expectedRate = await formatMoney(page, completed.hourlyRateCents, completed.currency);
  const expectedStart = await formatParkingTime(page, completed.startTime, central.timezone);
  const expectedEnd = await formatParkingTime(
    page,
    completed.endTime ?? completed.startTime,
    central.timezone,
  );
  const receipt = page.getByRole('region', { name: 'Operational receipt' });
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText('CC004');
  await expect(receipt).toContainText('Central Corrientes');
  await expect(receipt).toContainText(expectedStart);
  await expect(receipt).toContainText(expectedEnd);
  await expect(receipt).toContainText(`${expectedRate} / hour`);
  await expect(receipt).toContainText('1 hour');
  await expect(receipt).toContainText(expectedTotal);
  await expectNoHorizontalOverflow(page, 'compact light receipt');
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath('canonical-receipt-compact-light.png'),
  });

  await page
    .locator('.owner-mobile-header')
    .getByRole('combobox', { name: 'Theme' })
    .selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page, 'compact dark receipt');
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath('canonical-receipt-compact-dark.png'),
  });

  await page.setViewportSize({ height: 1000, width: 1440 });
  await expect(page.locator('.owner-sidebar').getByRole('combobox', { name: 'Theme' })).toHaveValue(
    'dark',
  );
  await expectNoHorizontalOverflow(page, 'wide dark session detail');
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath('canonical-session-detail-wide-dark.png'),
  });

  await page.getByRole('link', { exact: true, name: 'Parking operation' }).click();
  await expect(page).toHaveURL(new RegExp(`/app/parkings/${central.id}$`));
  await expectNoHorizontalOverflow(page, 'wide dark operation');
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath('canonical-operation-wide-dark.png'),
  });

  await page.getByRole('link', { exact: true, name: 'History' }).click();
  await expect(page).toHaveURL(new RegExp(`/app/parkings/${central.id}/sessions$`));
  const historySearch = page.getByLabel('Search plate', { exact: true });
  await historySearch.fill('CC004');
  const historySessionLink = page.getByRole('link', { name: 'Open session for CC004' }).first();
  await expect(historySessionLink).toBeVisible();
  await expect(historySessionLink).toContainText('Completed');
  await expect(historySessionLink).toContainText(expectedStart);
  await expect(historySessionLink).toContainText(expectedTotal);

  const historyResponse = await page.request.get(
    `${apiBaseUrl}/parkings/${central.id}/sessions?period=30d&plate=CC004`,
    { headers },
  );
  expect(historyResponse.status()).toBe(200);
  const history = (await historyResponse.json()) as SessionHistorySnapshot;
  expect(history.timezone).toBe(central.timezone);
  expect(history.aggregate.completedSessions).toBeGreaterThanOrEqual(1);
  const historyApiSession = history.data.find((item) => item.id === sessionId);
  expect(historyApiSession).toBeDefined();
  if (!historyApiSession) throw new Error(`History did not return session ${sessionId}.`);
  expect(historyApiSession.currency).toBe('ARS');
  expect(historyApiSession.id).toBe(sessionId);
  expect(historyApiSession.status).toBe('COMPLETED');
  expect(historyApiSession.totalAmountCents).toBe(completed.totalAmountCents);
  expect(historyApiSession.vehicle.plate).toBe('CC004');

  await page.goto(`/app/parkings/${full.id}`);
  await expect(
    page.getByRole('heading', { name: 'No spaces available', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { exact: true, name: 'Check in' })).toBeDisabled();
  await page.goto(`/app/parkings/${paused.id}`);
  await expect(page.getByRole('heading', { name: 'Parking paused', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { exact: true, name: 'Check in' })).toBeDisabled();

  await page.goto(`/app/parkings/${central.id}`);
  await expect(page.getByRole('button', { exact: true, name: 'Check in' })).toBeEnabled();
  await page.getByRole('button', { exact: true, name: 'Check in' }).click();
  const duplicateSheet = page.getByRole('dialog', { name: 'Check in vehicle' });
  await duplicateSheet.getByRole('textbox', { exact: true, name: 'Plate' }).fill('CC000');
  await expect(
    duplicateSheet.getByText(
      'A previously registered vehicle was found. Review its details before starting the stay.',
      { exact: true },
    ),
  ).toBeVisible();
  const duplicateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/parkings/${central.id}/sessions/check-in`) &&
      response.request().method() === 'POST',
  );
  await duplicateSheet.getByRole('button', { name: 'Start session' }).click();
  const duplicateResponse = await duplicateResponsePromise;
  expect(duplicateResponse.status()).toBe(409);
  expect((await duplicateResponse.json()) as { code: string }).toMatchObject({
    code: 'VEHICLE_ALREADY_ACTIVE',
  });
  await expect(duplicateSheet.getByRole('alert')).toContainText(
    'This plate already has an active stay here. Open it from the active list.',
  );
  await expectNoHorizontalOverflow(page, 'wide dark duplicate check-in state');

  await page.goto('/app/profile');
  const restoreButton = page.getByRole('button', { exact: true, name: 'Restore demo data' });
  await expect(restoreButton).toBeVisible();
  await restoreButton.click();
  const resetDialog = page.getByRole('dialog');
  await expect(resetDialog).toBeVisible();
  const resetResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/demo/reset') && response.request().method() === 'POST',
  );
  await resetDialog.getByRole('button', { exact: true, name: 'Restore demo data' }).click();
  const resetResponse = await resetResponsePromise;
  expect(resetResponse.status()).toBe(200);
  expect((await resetResponse.json()) as { restored: boolean }).toMatchObject({ restored: true });
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole('heading', { exact: true, name: 'Operations overview.' }),
  ).toBeVisible();
  const restoredCentral = await readOwnedParking(page, apiBaseUrl, accessToken, central.title);
  expect(restoredCentral).toMatchObject({
    activeSessionCount: 4,
    availableSpaces: 26,
    availabilityState: 'AVAILABLE',
  });

  const unexpectedConsoleErrors = consoleErrors.filter(
    (message) => !message.includes('status of 409 (Conflict)'),
  );
  expect(pageErrors, 'deployed page errors').toEqual([]);
  expect(unexpectedConsoleErrors, 'deployed console errors').toEqual([]);
  expect(requestFailures, 'deployed request failures').toEqual([]);
});
