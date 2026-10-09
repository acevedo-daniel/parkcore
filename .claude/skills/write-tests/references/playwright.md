# Playwright

Read the project's installed Playwright version, configuration, and fixtures first.
The examples use illustrative paths and budgets; adapt them once in configuration.

## Application readiness

Use a marker set by the application after the relevant client handlers are attached.
An SSR-rendered element, `DOMContentLoaded`, or `networkidle` does not prove hydration.
Reuse the project's signal; do not add a test-side marker that declares its own readiness.
See [navigation and hydration](https://playwright.dev/docs/navigations#hydration).

For a document-level marker, create `tests/e2e/fixtures.ts`:

```ts
import { test as base, expect, type Page, type Response } from "@playwright/test";

export async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}

async function waitForHtml(page: Page, response: Response | null): Promise<void> {
  const contentType = response?.headers()["content-type"] ?? "";
  if (/^(text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
    await waitForHydration(page);
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args: Parameters<Page["goto"]>) => {
      const response = await goto(...args);
      await waitForHtml(page, response);
      return response;
    };
    page.reload = async (...args: Parameters<Page["reload"]>) => {
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
```

Import `test` from this fixture in browser tests. Its assertion uses the shared
expectation budget and its HTML check leaves JSON or download endpoints alone.
This pattern extends Playwright's [built-in page fixture](https://playwright.dev/docs/test-fixtures).

For a click that causes a full document navigation, register the navigation wait
before clicking, then wait for the new document's readiness:

```ts
const navigation = page.waitForURL("**/account");
await page.getByRole("link", { name: "Account", exact: true }).click();
await navigation;
await waitForHydration(page);
```

Choose a destination URL that differs from the starting URL. For same-URL reloads,
wait for the navigation response before the readiness assertion, so an old marker
cannot satisfy it. For client-side routing, observe the destination's own ready
state; a document marker that remains true does not prove route data is ready.
Do not wrap clicks in assertion retries.

## Configure budgets and diagnostics

Set budgets in `playwright.config.ts`; choose values for the project's CI hardware.

```ts
import { defineConfig } from "@playwright/test";

const CI = Boolean(process.env.CI);

export default defineConfig({
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toPass: { timeout: 5_000 },
  },
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start:test",
    url: "http://127.0.0.1:3000",
    timeout: 120_000,
    reuseExistingServer: !CI,
  },
});
```

The server startup budget is separate from a test's budget. Replace the start
command with the project's real command. Preserve project reporters when extending
configuration. The JSON path matches the CI template's flaky-result reporting step.
Retain reports and traces on non-cancelled runs, including successful diagnostic retries.
See [configuration](https://playwright.dev/docs/api/class-testconfig).

## Assertions and repetition

Use role and label locators and web-first assertions:

```ts
await page.getByLabel("Email", { exact: true }).fill("person@example.test");
await page.getByRole("button", { name: "Save", exact: true }).click();
await expect(page.getByRole("status")).toHaveText("Saved");
```

Avoid immediate `isVisible()` or `evaluate()` reads for state that may still change.
Use `expect(...).toPass()` only to observe genuinely eventual external state; keep
mutations outside its callback. Its timeout is configured separately above because
it does not inherit `expect.timeout`. Never pass a timeout override at the call site.
See [retrying assertions](https://playwright.dev/docs/test-assertions).

Run changed E2E tests with `--repeat-each=5 --retries=0`; repaired flakes need at
least 10 repetitions. Use the project's runner command and include the containing
suite when workers, order, or shared state contributed to the failure.

## Lint guards without new plugins

Merge these entries into the existing ESLint flat configuration. Adjust the file
globs and fixture path to the project. Keep the fixture outside the import guard:

```js
{
  files: ["tests/e2e/**/*.{ts,tsx}"],
  ignores: ["tests/e2e/fixtures.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{
        name: "@playwright/test",
        importNames: ["test"],
        message: "Import test from the readiness fixture.",
      }],
    }],
    "no-restricted-syntax": ["error",
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='waitForTimeout']",
        message: "Wait on an observable condition.",
      },
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.object.name='test'][callee.property.name='setTimeout']",
        message: "Set budgets only in runner configuration.",
      },
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
        message: "Do not commit focused tests.",
      },
      {
        selector: "CallExpression > ObjectExpression > Property[key.name='timeout']",
        message: "Do not override wait or test budgets at call sites.",
      },
    ],
  },
}
```

The timeout selector is deliberately broad within browser-test files; narrow it
for unrelated domain objects if needed, without permitting timeout overrides.
These guards cover direct syntax; review aliases, computed properties, and helper
options too. Keep `forbidOnly` as the runner-level backstop.
See ESLint's [import restrictions](https://eslint.org/docs/latest/rules/no-restricted-imports)
and [syntax selectors](https://eslint.org/docs/latest/rules/no-restricted-syntax).
