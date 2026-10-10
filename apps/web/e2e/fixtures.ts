import { expect, test as base, type Locator, type Page, type Response } from '@playwright/test';

export async function chooseSelectOption(
  page: Page,
  combobox: Locator,
  optionName: string,
): Promise<void> {
  await combobox.click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

export async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

async function waitForHtml(page: Page, response: Response | null): Promise<void> {
  const contentType = response?.headers()['content-type'] ?? '';
  if (/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
    await waitForHydration(page);
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args: Parameters<Page['goto']>) => {
      const response = await goto(...args);
      await waitForHtml(page, response);
      return response;
    };
    page.reload = async (...args: Parameters<Page['reload']>) => {
      const response = await reload(...args);
      await waitForHtml(page, response);
      return response;
    };
    try {
      await use(page);
    } finally {
      page.goto = goto;
      page.reload = reload;
    }
  },
});

export { expect };
