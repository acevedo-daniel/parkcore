# Testing Library

Read the existing runner configuration, setup file, render helper, and network mocks.
Reuse project wrappers rather than creating a second rendering environment.

## Observable asynchronous results

- Use `getByRole` and `getByLabelText` for controls already present.
- Use `findBy*` for elements expected to appear asynchronously.
- Use `waitForElementToBeRemoved` for an existing loading indicator's disappearance.
- Use `waitFor` for eventual non-DOM assertions when no semantic query fits.
- Keep actions outside retry callbacks and await every `userEvent` interaction.

Prefer `findByRole` over `waitFor` plus `getByRole`:

```ts
const user = userEvent.setup();
render(<ProfileForm />);
await user.click(screen.getByRole("button", { name: "Save", exact: true }));
expect(await screen.findByRole("status")).toHaveTextContent("Saved");
```

If a loading indicator can disappear before the removal wait starts, use the
existing workflow helper or assert absence with an appropriate eventual assertion.
Do not call `waitForElementToBeRemoved` with an element already absent.
See [async methods](https://testing-library.com/docs/dom-testing-library/api-async/).

## Efficient user interaction

For long text when keystroke-by-keystroke behavior is irrelevant, focus the input
and use `user.paste`:

```ts
const user = userEvent.setup();
await user.click(screen.getByRole("textbox", { name: "Description", exact: true }));
await user.paste("A long description used to verify submitted content.");
```

Use typing when individual keyboard events are the behavior being tested. Do not
replace interaction with direct state mutation simply to make the test fast.
See [clipboard interactions](https://testing-library.com/docs/user-event/clipboard/).

## Shared budgets and controlled boundaries

Configure the runner's `testTimeout` globally, for example in Vitest:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 5_000,
    retry: 0,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

For Jest, use its global `testTimeout` configuration instead. In the shared setup:

```ts
import { configure } from "@testing-library/react";

configure({ asyncUtilTimeout: 1_000 });
```

Choose budgets once for CI hardware; keep the async utility budget below the test
budget. Do not pass a third timeout argument to a test or timeout options to a wait.
See [Testing Library configuration](https://testing-library.com/docs/dom-testing-library/api-configuration/).

Mock isolated requests at the network boundary with the project's existing tooling.
Return controlled payloads and errors; reset handlers between tests and reject
unexpected requests. Keep real services for tests whose subject is integration.
Control time and randomness only where the behavior depends on them.

Avoid fake timers with `userEvent` unless the behavior needs a controlled clock.
When needed, supply the runner's advancement function:

```ts
vi.useFakeTimers();
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
```

For Jest, use `jest.advanceTimersByTime`. Restore timers through the project's
teardown and drain owned work before restoration. Do not use `delay: null` as a
timeout workaround. See [user-event timer options](https://testing-library.com/docs/user-event/options/#advancetimers).

## Component performance and stability

A component test taking above about one second locally is a signal to inspect
unnecessary provider setup, large fixtures, repeated rendering, or long typing.
Split unrelated behaviors or move pure calculations to unit coverage while
preserving the intended interaction assertion. This is a diagnostic threshold,
not a reason to increase timeouts or weaken coverage.

Run new heavy component files repeatedly with runner retries disabled. For a
repaired flake, run at least 10 repetitions and include the containing suite when
shared mocks, teardown, or execution order may be implicated.

## Lint guards without new plugins

Scope these ESLint selectors to component-test files and merge with existing rules:

```js
{
  files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
  rules: {
    "no-restricted-syntax": ["error",
      {
        selector: "CallExpression[callee.name=/^(it|test)$/][arguments.length=3]",
        message: "Configure test budgets globally.",
      },
      {
        selector: "CallExpression[callee.name=/^(waitFor|waitForElementToBeRemoved)$/] > ObjectExpression > Property[key.name='timeout']",
        message: "Configure asyncUtilTimeout in shared setup.",
      },
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(findBy|findAllBy)/] > ObjectExpression > Property[key.name='timeout']",
        message: "Do not override asynchronous query budgets.",
      },
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
        message: "Do not commit focused tests.",
      },
    ],
  },
}
```

The direct-call selectors do not cover aliases, namespace imports, parameterized
tests, or options passed through variables. Review those forms and extend the
project's guards as needed; do not treat a lint pass as proof of determinism.
See ESLint's [syntax selectors](https://eslint.org/docs/latest/rules/no-restricted-syntax).
