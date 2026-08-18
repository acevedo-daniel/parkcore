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

[`render.yaml`](../render.yaml) declares the `parkcore-api` Render web service from the monorepo root. It uses Node `24.14.1`, pnpm, and the existing API workspace scripts:

| Stage                | Render command                                                        |
| -------------------- | --------------------------------------------------------------------- |
| Build                | `pnpm install --frozen-lockfile && pnpm --filter @parkcore/api build` |
| Pre-deploy migration | `pnpm --filter @parkcore/api prisma:migrate:deploy`                   |
| Start                | `pnpm --filter @parkcore/api start`                                   |
| Health check         | `GET /healthz`                                                        |

The `starter` plan is declared because Render's pre-deploy command is the supported place to run production migrations. It runs after a successful build and before the new API process starts. Do not replace it with `db:setup`, `prisma migrate dev`, or `prisma migrate reset`.

Render supplies the service port (`10000`); the API binds through `PORT`. Configure these values in Render when creating the Blueprint:

| Variable                                     | Source / rule                                                       |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                               | Neon production PostgreSQL connection string; secret.               |
| `JWT_SECRET`                                 | Unique production secret of at least 32 characters.                 |
| `CORS_ORIGINS`                               | Exact deployed Vercel web origin, without a path or trailing slash. |
| `NODE_VERSION`                               | `24.14.1`.                                                          |
| `NODE_ENV`                                   | `production`.                                                       |
| `PORT`                                       | `10000`, supplied for the Render web-service listener.              |
| `LOG_LEVEL`, `LOG_PRETTY`, `ENABLE_API_DOCS` | Declared non-secret runtime settings in `render.yaml`.              |

The Blueprint marks the connection string, JWT secret, and allowed browser origin with `sync: false`, so Render prompts for them instead of storing them in Git. It deploys `main` only after the linked CI checks pass. Syncing the Blueprint or creating the service remains a manual Render dashboard action; this repository change does not deploy it.

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
- Optional remote smoke check, with the public API URL supplied by the release environment:

  ```bash
  SMOKE_BASE_URL=https://your-api-host pnpm --filter @parkcore/api smoke:remote
  ```

- Confirm the deployed web build uses the intended `VITE_API_URL` and can complete the owner workflow.

## Related documentation

- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
