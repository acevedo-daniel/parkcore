# ParkCore - Deployment

> Production topology, configuration boundaries, migrations, release flow, and validation for ParkCore 1.0.

## Production topology

ParkCore uses three hosted services:

```text
Browser -> Vercel web -> Render API -> Neon PostgreSQL
```

| Component | Platform | Responsibility                             |
| --------- | -------- | ------------------------------------------ |
| Web       | Vercel   | Build and serve the static Vite SPA.       |
| API       | Render   | Run the Express API and expose `/healthz`. |
| Database  | Neon     | Host the production PostgreSQL database.   |

The repository keeps platform configuration at the deployment boundary through `vercel.json` and `render.yaml`.

## Release flow

The intended release sequence is:

```text
source
-> CI verification
-> forward database migration
-> API deployment
-> web deployment
-> health / browser validation
```

GitHub Actions verifies the source but does not deploy it directly. Render is configured to auto-deploy `main` after required checks pass.

The `Production` CI job also exercises the release boundary on a fresh,
job-scoped PostgreSQL service. It installs from the frozen lockfile, audits
production dependencies, applies forward migrations, builds the deployable
workspaces, checks the compiled artifacts, starts the compiled API, and runs
the startup smoke before the service is discarded.

Before a release, run:

```bash
pnpm release:readiness
```

## Render API

`render.yaml` defines the `parkcore-api` web service from the monorepo root.

### Build and migration

```bash
corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @parkcore/api build && pnpm --filter @parkcore/api prisma:migrate:deploy && pnpm --filter @parkcore/api showcase:refresh
```

The final command provisions or refreshes only the non-credentialed canonical
`SHOWCASE` facilities used by public discovery. It does not seed owner
credentials, create demo sandboxes, or rewrite normal owner data.

The production API verifies the SHOWCASE records before opening its listener
and repairs missing or stale canonical facilities. A normal API redeploy
therefore repairs a missing public showcase even when the existing Render
service does not expose a shell or has not yet synchronized the Blueprint
build command.

### Start

```bash
pnpm --filter @parkcore/api start
```

### Health check

```text
GET /healthz
```

The service uses Node.js 24 and reads its listener port from Render through `PORT`.

## Vercel web

`vercel.json` builds the web application from the repository root so the build can use the pnpm workspace and generated API client.

### Install

```bash
pnpm install --frozen-lockfile
```

### Build

```bash
pnpm contract:generate && pnpm --filter @parkcore/api-client build && pnpm --filter @parkcore/web build
```

### Output

```text
apps/web/dist
```

A catch-all rewrite sends frontend routes to `index.html`, allowing direct navigation and refresh on React Router paths.

The Vercel configuration also applies browser protection headers, including a Content Security Policy whose `connect-src` permits the deployed Render API.

## Production configuration

### Render / API

| Variable                  | Requirement                                      |
| ------------------------- | ------------------------------------------------ |
| `NODE_ENV`                | `production`                                     |
| `DATABASE_URL`            | Neon PostgreSQL connection string; secret        |
| `JWT_SECRET`              | Unique signing secret of at least 32 characters  |
| `CORS_ORIGINS`            | Exact allowed Vercel browser origin(s)           |
| `PORT`                    | Supplied by Render                               |
| `LOG_LEVEL`               | Non-secret runtime setting                       |
| `LOG_PRETTY`              | Disabled in the current production blueprint     |
| `ENABLE_API_DOCS`         | Disabled in the current production blueprint     |
| `DEMO_CLEANUP_BATCH_SIZE` | Optional bounded cleanup batch; defaults to `10` |

`render.yaml` marks `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` as values supplied outside Git.

### Vercel / web

| Variable       | Requirement                                      |
| -------------- | ------------------------------------------------ |
| `VITE_API_URL` | Public HTTPS base URL of the deployed Render API |

`VITE_API_URL` is browser configuration, not a secret. Do not add database credentials, JWT secrets, or other private values to Vercel's client build.

If the production API origin changes, update these together:

1. Vercel `VITE_API_URL`;
2. API `CORS_ORIGINS`;
3. the `connect-src` API origin in `vercel.json`.

## Database migrations

ParkCore uses committed forward Prisma migrations.

Production applies them and refreshes the public showcase with:

```bash
pnpm --filter @parkcore/api prisma:migrate:deploy
pnpm --filter @parkcore/api showcase:refresh
```

Inspect migration state with:

```bash
pnpm --filter @parkcore/api exec prisma migrate status
```

Production rules:

- do not run `pnpm db:setup`; it includes demo seeding;
- do not run `prisma migrate dev` against production;
- do not run `prisma migrate reset` against production;
- do not edit migration files that have already been applied;
- if a migration fails, stop the rollout and recover through a reviewed forward migration or the database provider's recovery facilities.

The current Render build command applies forward migrations and refreshes the
canonical public showcase before starting the new API process. The API startup
also verifies and repairs that SHOWCASE-only data. If the public directory is
empty after a deployment, inspect the Render build and API startup logs for
`showcase:refresh` or `Canonical public showcase ready` before
investigating frontend assets.

### Demo cleanup

Expired DEMO sandboxes can be removed by an external scheduler or by a
manual operator invocation:

```bash
pnpm --filter @parkcore/api demo:cleanup
```

Each invocation removes at most `DEMO_CLEANUP_BATCH_SIZE` expired DEMO
owners, ordered from oldest expiry, together with their dependent parking
data. Repeat the command until it reports zero removals when a backlog must
be drained. The command never targets `OWNER` or `SHOWCASE` users and does
not seed, reset, or rewrite normal production data.

CI verifies this command on its disposable database by creating expired and
unexpired DEMO fixtures plus OWNER and SHOWCASE sentinels, then running the
real command with a batch size of one. The check is intentionally not a
production seed or a deployment step.

## Validation

### API liveness

Production exposes:

```text
https://parkcore-api.onrender.com/healthz
```

The endpoint returns a process-liveness response and is the health check used by Render.

### Remote API smoke

```bash
SMOKE_BASE_URL=https://parkcore-api.onrender.com pnpm --filter @parkcore/api smoke:remote
```

The default remote smoke check is intentionally safe and verifies API
liveness plus the root service response. Optional documentation/authentication
checks should only be enabled when their side effects and environment are
appropriate.

### Web / full-stack smoke

```powershell
$env:REAL_STACK_WEB_URL = 'https://parkcore-app.vercel.app'
pnpm --filter @parkcore/web test:e2e:real
Remove-Item Env:REAL_STACK_WEB_URL
```

This verifies the deployed browser application against its configured API without route mocking.

For wider explicit browser QA:

```bash
pnpm --filter @parkcore/web test:e2e:browser-qa
```

## Deployment boundaries

- Vercel serves the static frontend; it does not proxy the ParkCore API.
- Render is the only application runtime that receives database credentials.
- Neon is not accessed directly by the browser.
- CI verifies source quality, contract consistency, fresh-database migration,
  compiled startup, and the browser secret boundary; platform services perform
  the actual deployment.
- Production API documentation is disabled by the current Render configuration.

## Related documentation

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
