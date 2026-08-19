# ParkCore — Testing

> Test strategy, boundaries, data setup, coverage thresholds, and release verification for ParkCore 1.0.

## Strategy

ParkCore tests the system at several boundaries rather than relying on one large end-to-end suite.

The API suite exercises domain rules, authorization, validation, persistence behavior, and session transitions against PostgreSQL. The web suite verifies browser-facing components and route behavior. A generated-contract check protects the API/client boundary, while Playwright covers the owner workflow separately.

Real-stack browser checks are available for explicit production verification but are not part of the default CI workflow.

## Test layers

| Layer                     | Purpose                                                                                                      | Tool / location                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| API tests                 | Domain rules, authorization, validation, error behavior, persistence, rate limiting, and session transitions | Vitest + Supertest in `apps/api/src/**/*.test.ts` and `apps/api/tests` |
| Web tests                 | Forms, route behavior, loading/error states, and UI interactions                                             | Vitest + Testing Library in `apps/web/src/**/*.test.{ts,tsx}`          |
| Contract check            | Detect drift between the API OpenAPI artifact and generated browser client                                   | `pnpm contract:check`                                                  |
| Mocked browser workflow   | Verify the owner workflow against contract-shaped mocked responses                                           | Playwright in `apps/web/e2e`                                           |
| Real-stack browser checks | Exercise the deployed web application and its configured API                                                 | Playwright real-stack configuration; run explicitly                    |
| Remote API smoke          | Verify deployed API liveness and optional remote behavior                                                    | `pnpm --filter @parkcore/api smoke:remote`                             |

## Test data and dependencies

### API

API tests use PostgreSQL rather than an in-memory substitute for persistence-sensitive behavior.

CI provisions a PostgreSQL service, then runs:

```bash
pnpm --filter @parkcore/api db:setup
pnpm --filter @parkcore/api quality:ci
pnpm --filter @parkcore/api release:readiness
```

This verifies that committed migrations and the seed can bootstrap a fresh database before the API quality checks run.

### Web

The default Playwright suite runs against a local production preview and intercepts API requests with contract-shaped responses. It therefore tests browser workflow independently from a live API/database.

Real-stack Playwright checks are separate so normal CI stays deterministic and does not create data in the deployed environment.

## Critical behavior

The test strategy protects the rules that define the parking workflow:

- only active parkings are publicly discoverable and eligible for check-in;
- only the owner may operate a parking or its sessions;
- capacity and duplicate-active-vehicle checks remain safe during concurrent check-ins;
- a session transitions from `ACTIVE` to only `COMPLETED` or `CANCELLED`;
- checkout uses the session's immutable pricing snapshot;
- the generated web client remains synchronized with the API contract.

## Run tests

From the repository root:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm --filter @parkcore/web test:e2e
pnpm contract:check
```

## Coverage thresholds

Vitest enforces these minimum thresholds:

| Workspace  | Lines | Functions | Statements | Branches |
| ---------- | ----: | --------: | ---------: | -------: |
| `apps/api` |   70% |       70% |        70% |      60% |
| `apps/web` |   65% |       65% |        65% |      55% |

Coverage is a release gate, not a substitute for verifying the critical behaviors above.

## Contract verification

Run:

```bash
pnpm contract:check
```

The command regenerates:

- `apps/api/openapi.json`;
- `packages/api-client/src/generated/schema.ts`;

and fails when either differs from the committed version.

This turns API/client synchronization into an explicit CI check rather than a manual convention.

## Browser verification

### Default workflow

```bash
pnpm --filter @parkcore/web test:e2e
```

This is the deterministic mocked owner workflow used in CI.

### Deployed real-stack check

```powershell
$env:REAL_STACK_WEB_URL = 'https://parkcore-app.vercel.app'
pnpm --filter @parkcore/web test:e2e:real
Remove-Item Env:REAL_STACK_WEB_URL
```

The real-stack configuration uses the deployed browser application and its configured API without route mocking.

Additional explicit QA commands are available:

```bash
pnpm --filter @parkcore/web test:e2e:browser-qa
pnpm --filter @parkcore/web test:e2e:responsive
```

The browser-QA command runs the real-stack workflow across Chromium, Firefox, and installed Microsoft Edge; responsive QA runs its production checks in Chromium.

## CI

`.github/workflows/ci.yml` separates verification into five jobs:

1. **format** — repository formatting;
2. **api** — PostgreSQL bootstrap, API coverage/quality, OpenAPI and build readiness;
3. **web** — frontend lint, typecheck, tests, and build;
4. **web-e2e** — Playwright browser workflow;
5. **contract** — generated API/client drift detection.

CI runs for pushes and pull requests targeting `main`.

## Release verification

The root release command is:

```bash
pnpm release:readiness
```

It runs:

```text
lint
-> typecheck
-> test:coverage
-> contract:check
-> build
-> web E2E
```

Use it before treating a cross-workspace change as release-ready. A production-style build also needs a valid `VITE_API_URL`.

## Related documentation

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Deployment](DEPLOYMENT.md)
