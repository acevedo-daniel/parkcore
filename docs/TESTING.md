# ParkCore - Testing

> Test strategy, boundaries, data setup, coverage thresholds, and release verification for ParkCore 1.0.

## Strategy

ParkCore tests the system at several boundaries rather than relying on one large end-to-end suite.

The API suite exercises domain rules, authorization, validation, persistence behavior, and session transitions against PostgreSQL. The web suite verifies browser-facing components and route behavior. A generated-contract check protects the API/client boundary, while Playwright covers the owner workflow separately.

Local real-stack browser checks run against disposable services. Deployed real-stack checks remain explicit remote verification and are not part of the production pull request path.

## Test layers

| Layer                     | Purpose                                                                                                      | Tool / location                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| API tests                 | Domain rules, authorization, validation, error behavior, persistence, rate limiting, and session transitions | Vitest + Supertest in `apps/api/src/**/*.test.ts` and `apps/api/tests` |
| Web tests                 | Forms, route behavior, loading/error states, and UI interactions                                             | Vitest + Testing Library in `apps/web/src/**/*.test.{ts,tsx}`          |
| Contract check            | Detect drift between the API OpenAPI artifact and generated browser client                                   | `pnpm contract:check`                                                  |
| Mocked browser workflow   | Verify the owner workflow against contract-shaped mocked responses                                           | Playwright in `apps/web/e2e`                                           |
| Local real-stack workflow | Exercise the local preview, API, and PostgreSQL persistence boundary                                         | `pnpm --filter @parkcore/web test:e2e:local`                           |
| Remote real-stack checks  | Exercise the deployed web application and its configured API                                                 | Playwright real-stack configuration; run explicitly                    |
| Remote API smoke          | Verify deployed API liveness and optional remote behavior                                                    | `pnpm --filter @parkcore/api smoke:remote`                             |

## Test data and dependencies

### Dependency baseline

Verification starts from the committed dependency graph:

```bash
pnpm install --frozen-lockfile
pnpm audit --prod
```

The production audit must report no known vulnerabilities before the workspace checks run. See [Development](DEVELOPMENT.md#dependency-note) for the maintained transitive security overrides.

### API

API tests use PostgreSQL rather than an in-memory substitute for persistence-sensitive behavior.

CI provisions a PostgreSQL service, then runs:

```bash
pnpm --filter @parkcore/api db:setup
pnpm --filter @parkcore/api test:coverage
```

This verifies that committed migrations and the seed can bootstrap a fresh database before the API coverage tests run. Repository-wide lint and typecheck belong to the separate `Quality` job, while deployable builds belong to `Production`.

### Web

The default Playwright suite runs against a local production preview and intercepts API requests with contract-shaped responses. It therefore tests browser workflow independently from a live API/database.

The local real-stack workflow uses a disposable PostgreSQL service on port `5433`, applies committed migrations, runs the deterministic seed, starts the API on port `3000`, and serves the built web application on port `4173`. The smoke test uses the deterministic seeded owner, creates a parking, completes a session through the actual API, and leaves no production data behind.

Local real-stack runs start and stop their API and web processes through Playwright. Start and clean up the disposable database from the repository root:

```bash
pnpm e2e:local:db:up
pnpm --filter @parkcore/web test:e2e:local
pnpm e2e:local:db:down
```

Failed runs retain traces, screenshots, videos, and the HTML report under `apps/web/test-results/local-real-stack/` and `apps/web/playwright-report/local-real-stack/`. The required CI workflow uploads these directories on failure.

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
pnpm text:check
pnpm format:check
pnpm --filter @parkcore/api-client build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm --filter @parkcore/web test:e2e
pnpm contract:check
pnpm build
```

These commands are the local equivalents of the required CI boundaries. The generated API client must be built before web tests from a clean checkout. The API coverage command needs the documented PostgreSQL setup, the local real-stack command needs the isolated E2E database lifecycle, and `pnpm build` needs `VITE_API_URL`.

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

This is the deterministic mocked owner workflow used for fast UI-level feedback.

### Local real-stack workflow

```bash
pnpm e2e:local:db:up
pnpm --filter @parkcore/web test:e2e:local
pnpm e2e:local:db:down
```

This workflow uses local API and web processes with a disposable PostgreSQL service. It bootstraps committed migrations and deterministic seed data before running the critical owner journey. Do not use the regular development database for this command.

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

`.github/workflows/ci.yml` separates verification into six conceptual jobs and one final gate:

1. **Quality**: authored text, formatting, lint, and typecheck;
2. **Tests / API**: PostgreSQL bootstrap and API coverage tests;
3. **Tests / Web**: browser-facing unit and component tests;
4. **Contract**: generated API/client drift detection;
5. **E2E**: local real-stack Playwright browser workflow with PostgreSQL and failure diagnostics;
6. **Production**: deployable API, client, and web builds;
7. **CI Gate**: the stable required check that fails when any verification job fails, is cancelled, or is skipped.

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
