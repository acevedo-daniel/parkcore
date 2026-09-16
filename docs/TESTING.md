# ParkCore - Testing

> Test strategy, boundaries, data setup, coverage thresholds, and release verification for ParkCore 1.0.

## Strategy

ParkCore tests the system at several boundaries rather than relying on one large end-to-end suite.

The API suite exercises domain rules, authorization, validation, persistence behavior, and session transitions against PostgreSQL. The web suite verifies browser-facing components and route behavior. A generated-contract check protects the API/client boundary, while Playwright covers the public visitor and owner workflows separately.

Local real-stack browser checks run against disposable services. Deployed real-stack checks remain explicit remote verification and are not part of the production pull request path.

## Test layers

| Layer                     | Purpose                                                                                                      | Tool / location                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| API tests                 | Domain rules, authorization, validation, error behavior, persistence, rate limiting, and session transitions | Vitest + Supertest in `apps/api/src/**/*.test.ts` and `apps/api/tests` |
| Web tests                 | Forms, route behavior, loading/error states, UI interactions, and Spanish/English shared-workflow parity     | Vitest + Testing Library in `apps/web/src/**/*.test.{ts,tsx}`          |
| Localization parity       | Detect missing or extra keys, blank values, and interpolation drift between locale catalogs                  | `pnpm locales:check`                                                   |
| Contract check            | Detect drift between the API OpenAPI artifact and generated browser client                                   | `pnpm contract:check`                                                  |
| Mocked browser workflows  | Verify public discovery and owner workflows against contract-shaped mocked responses                         | Playwright in `apps/web/e2e`                                           |
| Browser hardening matrix  | Verify every P0/P1 route across both shells, locales, themes, exact responsive viewports, focus, and axe     | `pnpm --filter @parkcore/web test:e2e:hardening`                       |
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

The canonical seed provisions the stable SHOWCASE identity and its fictional public scenario. DEMO identities are created only through `POST /demo/login`, so lifecycle integration tests create multiple sandboxes, exercise owner-scoped reset and expiry recovery, and verify bounded cleanup leaves OWNER and SHOWCASE data untouched. The explicit maintenance smoke command is:

```bash
pnpm --filter @parkcore/api demo:cleanup
```

### Web

The default Playwright suite runs against a local production preview and intercepts API requests with contract-shaped responses. It therefore tests browser workflow independently from a live API/database.

The local real-stack workflow uses a disposable PostgreSQL service on port `5433`, applies committed migrations, runs the deterministic seed, starts the API on port `3000`, and serves the built web application on port `4173`. The browser journey opens an isolated DEMO sandbox, operates the canonical Central Corrientes facility with returning vehicle `CC004`, completes a stay through the actual API, verifies the receipt and history, and checks deterministic full, paused, and duplicate check-in states. It leaves no production data behind.

Local real-stack runs start and stop their API and web processes through Playwright. Start and clean up the disposable database from the repository root:

```bash
pnpm e2e:local:db:up
pnpm --filter @parkcore/web test:e2e:local
pnpm e2e:local:db:down
```

Failed runs retain traces, screenshots, videos, and the HTML report under `apps/web/test-results/local-real-stack/` and `apps/web/playwright-report/local-real-stack/`. The required CI workflow uploads these directories on failure.

### Production preview smoke

```bash
pnpm e2e:local:db:up
pnpm --filter @parkcore/web test:e2e:production-preview
pnpm e2e:local:db:down
```

This check builds the API client and web artifact, starts the compiled API with explicit disposable-database settings, verifies `/healthz` and the API root, and serves the web artifact through Vite preview. The browser then loads the public landing page, enters the isolated demo, and verifies that the public and protected requests use the configured local API origin, including `/parkings`, `/demo/login`, `/parkings/me`, and `/analytics/summary`. It does not use remote URLs, production credentials, or personal data.

The artifact check rejects server-only runtime configuration in `apps/web/dist`, while allowing the public `VITE_API_URL`. It also prints route-chunk and canonical-asset inventories for review. Failed runs retain diagnostics under `apps/web/test-results/production-preview/` and `apps/web/playwright-report/production-preview/`.

## Critical behavior

The test strategy protects the rules that define the parking workflow:

- only active parkings are publicly discoverable and eligible for check-in;
- only the owner may operate a parking or its sessions;
- capacity and duplicate-active-vehicle checks remain safe during concurrent check-ins;
- a session transitions from `ACTIVE` to only `COMPLETED` or `CANCELLED`;
- checkout uses the session's immutable pricing snapshot;
- concurrent DEMO creation and reset remain owner-scoped, and expired DEMO access returns a recoverable authentication error;
- public discovery includes the stable SHOWCASE scenario, marks it as fictional demonstration data, and excludes DEMO facilities;
- showcase refresh preserves canonical facility and asset identities while rebasing time-dependent records;
- expired cleanup removes only DEMO owners and remains bounded;
- the owner overview uses one owner-scoped active-session request regardless of facility count, while public and owner parking snapshots use active-session counts when detailed sessions are not needed;
- the generated web client remains synchronized with the API contract.
- shared auth, parking, and check-in forms render localized labels and validation in both locales;
- API failures are mapped to catalog messages instead of exposing backend response text;
- localized form errors, loading states, success feedback, and ARIA names remain queryable in the selected locale.
- shared domain primitives preserve visible status meaning, localized display values, and combobox keyboard, option, outside-click, and focus behavior.

## Run tests

From the repository root:

```bash
pnpm text:check
pnpm locales:check
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

This is the deterministic mocked browser workflow used for fast UI-level feedback. It covers public landing discovery, the started-hour estimator, URL-backed directory filters, SHOWCASE disclosure, directions attributes, auth entry and autofill semantics, isolated demo entry, public not-found recovery, loading/empty/error/retry/filter-validation states, and the responsive light/dark screenshot matrix. The existing owner workflow continues to cover language switching, explicit and system appearance changes, form-state preservation, reduced-motion behavior, keyboard navigation, dialog and sheet focus restoration, and the representative owner success path.

### Browser hardening matrix

```bash
pnpm --filter @parkcore/web test:e2e:hardening
```

The hardening command builds and serves the web application through the local production preview, then intercepts only the local API origin with deterministic, contract-shaped fixtures. It never requires a remote URL, production credentials, or personal data. The suite opens every P0/P1 route in the public and owner shells at 360x800, 390x844, 768x1024, 1024x900, 1280x900, and 1440x960 for both `es-AR` and `en-US`. It also exercises public and owner not-found recovery, light and dark themes, loading, empty, error, blocked, degraded, form, table, chart, sheet, and dialog states.

The axe gate scans the rendered `body` of each required route fixture at compact and wide representative sizes in both locales and themes. Only `serious` and `critical` axe impacts block the command. Responsive assertions cover document overflow, fixed mobile-navigation clearance, focused controls, visible focus indicators, overlay bounds, focus containment, Escape handling, and focus restoration. The preference fixtures cover stored light and dark values, system-light and system-dark first render, and operating-system transitions while system mode is selected. Localization parity also rejects blank strings and interpolation placeholder mismatches, while `pnpm text:check` remains the authored em dash gate.

Failure traces, screenshots, videos, and the HTML report are retained under `apps/web/test-results/hardening/` and `apps/web/playwright-report/hardening/`. These are generated diagnostics and must not be committed. The deployed responsive command below remains an explicit remote check because local mocked verification cannot prove deployed CSS, browser, CDN, or API behavior.

Before release, manually verify the canonical keyboard journey from public landing through directory, detail, login, owner operation, check-in, checkout, history, and profile. Include skip links, landmarks, tab order, combobox Arrow and Escape behavior, overlay focus containment and return, form error focus, autofill, 200 percent zoom, reduced motion, longest Spanish and English labels, screen-reader names for landmarks and status regions, and fixed-navigation clearance for focused content.

### Local real-stack workflow

```bash
pnpm e2e:local:db:up
pnpm --filter @parkcore/web test:e2e:local
pnpm e2e:local:db:down
```

This workflow uses local API and web processes with a disposable PostgreSQL service. It bootstraps committed migrations and deterministic seed data before running the critical isolated-demo journey from returning-vehicle lookup through check-in, occupancy, session detail, checkout, receipt, and history. Do not use the regular development database for this command.

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
6. **E2E / Web**: credential-free deterministic browser hardening matrix with responsive, accessibility, theme, and localization checks;
7. **Production**: deployable API, client, and web builds;
8. **CI Gate**: the stable required check that fails when any verification job fails, is cancelled, or is skipped.

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
