# Deployment

> Release sequence and production database migration procedure for ParkCore 1.0.

## Environments

| Environment | Purpose                                          | Deployment source        |
| ----------- | ------------------------------------------------ | ------------------------ |
| Local       | Development and disposable database verification | `docker-compose.yml`     |
| Production  | Static web, API, and PostgreSQL                  | Vercel, Render, and Neon |

## Deployment targets

ParkCore 1.0 uses a deliberately small hosted topology:

```text
Browser -> Vercel web -> HTTPS -> Render API -> Neon PostgreSQL
```

| Component | Selected target | Responsibility                                       |
| --------- | --------------- | ---------------------------------------------------- |
| Web       | Vercel          | Builds and serves the static Vite SPA.               |
| API       | Render          | Runs the independently deployable Express API.       |
| Database  | Neon            | Provides the managed production PostgreSQL database. |

The API already declares its Render production URL in OpenAPI. The repository contains a declarative Render service configuration, but no deployment resources or credentials. Keep this topology unless a concrete deployment constraint requires a reviewed change.

## Release flow

```text
source -> CI checks -> production migration job -> API deployment -> web deployment -> health check
```

CI verifies API, web, generated contract, coverage, build, and browser workflow. It does not deploy. Run the production steps from Vercel, Render, Neon, or a dedicated release job with the production configuration; do not run them from a developer workstation against a remote database.

## Render API service

[`render.yaml`](../render.yaml) declares the `parkcore-api` Render web service from the monorepo root. It uses the root Node `24.x` engine, pnpm, and the existing API workspace scripts:

| Stage               | Render command                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build and migration | `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @parkcore/api build && pnpm --filter @parkcore/api prisma:migrate:deploy` |
| Start               | `pnpm --filter @parkcore/api start`                                                                                                                        |
| Health check        | `GET /healthz`                                                                                                                                             |

The Blueprint declares Render's free plan and runs the forward migration at the end of the successful build before the new API process starts. Do not replace that command with `db:setup`, `prisma migrate dev`, or `prisma migrate reset`.

Render supplies the service port (`10000`); the API binds through `PORT`. Configure these values in Render when creating the Blueprint:

| Variable                                     | Source / rule                                                       |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                               | Neon production PostgreSQL connection string; secret.               |
| `JWT_SECRET`                                 | Unique production secret of at least 32 characters.                 |
| `CORS_ORIGINS`                               | Exact deployed Vercel web origin, without a path or trailing slash. |
| Node version                                 | `24.x`, inherited from the root `package.json` engine.              |
| `NODE_ENV`                                   | `production`.                                                       |
| `PORT`                                       | `10000`, supplied for the Render web-service listener.              |
| `LOG_LEVEL`, `LOG_PRETTY`, `ENABLE_API_DOCS` | Declared non-secret runtime settings in `render.yaml`.              |

The Blueprint marks the connection string, JWT secret, and allowed browser origin with `sync: false`, so Render prompts for them instead of storing them in Git. It deploys `main` only after the linked CI checks pass. Syncing the Blueprint or creating the service remains a manual Render dashboard action; this repository change does not deploy it.

## Vercel web project

[`vercel.json`](../vercel.json) configures the Vite SPA as a Vercel project from the repository root. Keeping the root directory at the repository root gives the build access to the pnpm workspace and `@parkcore/api-client`.

| Stage            | Vercel command / setting                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Node.js          | `24.x`, inherited from the root `package.json` `engines` field.                                           |
| Install          | `pnpm install --frozen-lockfile`                                                                          |
| Build            | `pnpm contract:generate && pnpm --filter @parkcore/api-client build && pnpm --filter @parkcore/web build` |
| Output directory | `apps/web/dist`                                                                                           |
| SPA routing      | `/(.*)` rewrites to `/index.html`                                                                         |

Set `VITE_API_URL` in Vercel's Production environment to the HTTPS Render API origin (`https://parkcore-api.onrender.com`). This is the only browser API location value and is public by design; do not add API, Neon, or JWT secrets to Vercel. Use the same HTTPS value for previews unless a separate preview API is deliberately provisioned.

Vercel serves the static site over HTTPS. The rewrite preserves direct navigation and refresh for `/app/...` and public client routes while the browser makes API calls directly to the configured Render origin; Vercel does not proxy API traffic.

`vercel.json` also sends a restrictive Content Security Policy and baseline browser protection headers. The policy permits API connections only to `https://parkcore-api.onrender.com`, allows HTTPS parking images, and blocks framing and browser access to camera, microphone, and geolocation. If the deployed API origin changes, update the CSP `connect-src` value together with Vercel's `VITE_API_URL` and the API's `CORS_ORIGINS`.

When creating the Vercel project manually, import this repository, leave **Root Directory** at the repository root, select Node `24.x` if the dashboard asks, and add `VITE_API_URL` before the first production deployment. Do not set its Root Directory to `apps/web`, because this build intentionally consumes the root pnpm workspace and generated contract package.

## Configuration and secrets

Set API production configuration and web build configuration in the deployment platform. The required boundary is documented in [Development](DEVELOPMENT.md): `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `CORS_ORIGINS` belong to the API; only public `VITE_API_URL` belongs to the web build.

Never commit or print production values. The migration job needs `DATABASE_URL` only for its target database.

## Standard deployment

1. Confirm `pnpm release:readiness` has passed for the release source.
2. Configure the API and web production environment values in Render and Vercel respectively, and the production database connection in Neon.
3. Run the database migration procedure below before starting the new API version.
4. Deploy the API, then deploy the web build with its public `VITE_API_URL`.
5. Validate the running API and critical browser workflow.

## Web hosting and SPA routing

`apps/web` produces a static single-page application. Build it with the public `VITE_API_URL` for the deployed API; the production build fails if that variable is absent. The value is embedded in the browser bundle, so it is not a runtime secret.

Configure the static host's history API fallback so unknown **frontend** paths return `index.html`. This is required for direct navigation and browser refresh on public and owner routes such as `/parkings/:parkingId` and `/app/parkings/:parkingId`.

Serve static assets normally and keep API traffic outside this fallback. When a reverse proxy shares a host for web and API, route the API paths to the API service before applying the catch-all frontend rewrite. Do not rewrite API responses, health checks, OpenAPI endpoints, or missing API routes to `index.html`.

## Database migrations

ParkCore uses committed forward Prisma migrations. Historical migration files are immutable.

Run this command from the API workspace in a release environment that has the production `DATABASE_URL` and the Prisma CLI available:

```bash
pnpm --filter @parkcore/api prisma:migrate:deploy
```

Then verify the migration state without changing data:

```bash
pnpm --filter @parkcore/api exec prisma migrate status
```

The ParkCore 1.0 migration history contains intentional guards for legacy parking, booking, pricing, and vehicle data. A clean database applies all migrations as verified. Do not run the migration blindly against a pre-1.0 database with retained data: first use the approved export/reset or reviewed preservation process for that data.

Do not use `pnpm db:setup` in production: it seeds data. Do not use `prisma migrate dev` or `prisma migrate reset` against production. Do not edit applied migration history. If a migration fails, stop the rollout, inspect the provider logs and migration state, and recover with a reviewed forward migration or the provider's documented recovery process; the repository has no automated rollback or backup integration.

## Validation

- API health: `GET /healthz` returns `200` with `{ "status": "ok" }` and `Cache-Control: no-store`. It is a process liveness check and intentionally does not orchestrate database or external dependency checks.
- Remote smoke check, with the public API URL supplied by the release environment. By default this checks only `/healthz`, which is the production-safe API surface:

  ```bash
  SMOKE_BASE_URL=https://your-api-host pnpm --filter @parkcore/api smoke:remote
  ```

  Set `SMOKE_CHECK_DOCS=true` only where API documentation is intentionally enabled. Production disables public OpenAPI documentation, so this check must remain off there. Set `SMOKE_WITH_AUTH=true` only for a disposable environment or account because it registers a smoke user.

- Confirm the deployed web build uses the intended `VITE_API_URL` and can complete the owner workflow.
- Real-stack smoke test (not part of CI; it uses a disposable account, completes its session, and deactivates its test parking):

  ```powershell
  $env:REAL_STACK_WEB_URL = 'https://parkcore-app.vercel.app'
  pnpm --filter @parkcore/web test:e2e:real
  Remove-Item Env:REAL_STACK_WEB_URL
  ```

  This test uses the deployed browser application and its configured API, with no route mocking or local server. It requires the Render API to allow the Vercel origin through `CORS_ORIGINS`. The demo account and terminal session remain because ParkCore intentionally has no account or parking hard-delete endpoint.

- Browser QA runs the same smoke sequentially in Chromium, Firefox, and installed Microsoft Edge:

  ```powershell
  $env:REAL_STACK_WEB_URL = 'https://parkcore-app.vercel.app'
  pnpm --filter @parkcore/web test:e2e:browser-qa
  Remove-Item Env:REAL_STACK_WEB_URL
  ```

  Safari is not covered because this workspace has no Apple environment.

## Related documentation

- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
