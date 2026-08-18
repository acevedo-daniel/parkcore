# Testing

> Test strategy, test boundaries, data setup, and release verification for ParkCore 1.0.

## Strategy

ParkCore verifies its domain rules at the API boundary, its public and owner behavior in the web application, and the generated OpenAPI contract between them. Browser tests cover the operational owner workflow without requiring a running API; a separate smoke check exercises the deployed stack when explicitly requested.

## Test layers

| Layer                           | Purpose                                                                                           | Tool / location                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| API unit and route tests        | Domain rules, authorization, validation, error contracts, rate limiting, and session transitions. | Vitest in `apps/api/src/**/*.test.ts` and `apps/api/tests`. |
| Web component and route tests   | Forms, accessibility, loading/error states, and route behavior.                                   | Vitest + Testing Library in `apps/web/src/**/*.test.tsx`.   |
| Contract check                  | Detect drift between API OpenAPI output and the generated browser client.                         | `pnpm contract:check`.                                      |
| Mocked browser workflow         | Owner login, parking operations, and checkout flow against contract-shaped mocked responses.      | Playwright in `apps/web/e2e/owner-workflow.spec.ts`.        |
| Real-stack smoke and browser QA | Verify the deployed web, API, and PostgreSQL integration.                                         | Playwright real-stack configuration; run manually.          |

## Test data and external dependencies

The API test environment supplies its own non-production database URL and CI starts an ephemeral PostgreSQL service before `pnpm --filter @parkcore/api db:setup`. Local database setup uses the Docker Compose `parkcore-db` container.

The default Playwright workflow starts a local production preview and intercepts API requests, so it does not require a local API or database. The real-stack workflow requires `REAL_STACK_WEB_URL`, uses a disposable account, and leaves its demo account and terminal session because ParkCore has no hard-delete endpoint.

## Critical behavior

- Only active parkings are public and accept check-ins.
- Capacity and duplicate active-vehicle checks stay safe under concurrent check-ins.
- A session transitions only from `ACTIVE` to `COMPLETED` or `CANCELLED`.
- Checkout calculates from the session's immutable rate and currency snapshot.
- The web client remains synchronized with the published OpenAPI contract.

## Run tests

```bash
pnpm test
pnpm test:coverage
pnpm --filter @parkcore/web test:e2e
pnpm contract:check
```

For a production-stack smoke test:

```powershell
$env:REAL_STACK_WEB_URL = 'https://parkcore-app.vercel.app'
pnpm --filter @parkcore/web test:e2e:real
Remove-Item Env:REAL_STACK_WEB_URL
```

`test:e2e:browser-qa` runs the same real workflow sequentially in Chromium, Firefox, and installed Microsoft Edge. `test:e2e:responsive` performs the production responsive QA in Chromium.

## Coverage

Vitest enforces these repository thresholds:

| Workspace  | Lines / functions / statements | Branches |
| ---------- | ------------------------------ | -------- |
| `apps/api` | 70%                            | 60%      |
| `apps/web` | 65%                            | 55%      |

## Required verification

Before handing off a cross-workspace change, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @parkcore/web test:e2e
pnpm contract:check
pnpm build
```

Set `VITE_API_URL` to a valid public API origin before a production build when it is not already available through `apps/web/.env`.

## Related documentation

- [README](../README.md)
- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT.md)
