# ParkCore — Development

> Local setup, environment configuration, workspace commands, and database workflow for ParkCore 1.0.

## Requirements

| Tool           | Version / requirement                       | Source               |
| -------------- | ------------------------------------------- | -------------------- |
| Node.js        | 24.x                                        | root `package.json`  |
| pnpm           | 10.33.0                                     | root `package.json`  |
| Docker Desktop | Required for the local PostgreSQL container | `docker-compose.yml` |

## Initial setup

From the repository root:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp` instead of `Copy-Item`.

Docker Compose starts PostgreSQL only. The API and web development processes run on the host through pnpm.

## Local environment

Real `.env` files are ignored by Git. Copy the examples and keep non-development credentials outside version control.

### API

`apps/api/.env` contains the local API runtime configuration.

| Variable                    | Required locally | Purpose                                                                  |
| --------------------------- | :--------------: | ------------------------------------------------------------------------ |
| `NODE_ENV`                  |        No        | Runtime mode; local example uses `development`.                          |
| `PORT`                      |        No        | API port; defaults to `3000`.                                            |
| `CORS_ORIGINS`              |        No        | Allowed browser origins; local example permits the Vite origin.          |
| `JWT_SECRET`                |       Yes        | Access-token signing secret. Use the example only for local development. |
| `JWT_EXPIRES_IN`            |        No        | Access-token lifetime; default is `24h`.                                 |
| `AUTH_RATE_LIMIT_MAX`       |        No        | Maximum authentication requests per rate-limit window.                   |
| `AUTH_RATE_LIMIT_WINDOW_MS` |        No        | Authentication rate-limit window duration.                               |
| `LOG_LEVEL`                 |        No        | Pino log level.                                                          |
| `LOG_PRETTY`                |        No        | Enables readable local logging.                                          |
| `ENABLE_API_DOCS`           |        No        | Controls the API reference outside the normal development behavior.      |
| `DATABASE_URL`              |       Yes        | PostgreSQL connection used by Prisma and the API.                        |

The local example points `DATABASE_URL` to the PostgreSQL container started by `pnpm docker:up`.

### Web

`apps/web/.env` contains browser-safe configuration only:

| Variable       | Required locally | Purpose                                                                                            |
| -------------- | :--------------: | -------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` |        No        | Base URL used by the generated browser API client. Local development uses `http://localhost:3000`. |

Never put secrets in `VITE_*` variables; Vite embeds them into the browser build.

## Run locally

```bash
pnpm dev
```

Typical local URLs:

- API: `http://localhost:3000`
- API reference: `http://localhost:3000/docs`
- Web: `http://localhost:5173`

## Root commands

| Task                     | Command                                | Purpose                                                          |
| ------------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| Start database           | `pnpm docker:up`                       | Start local PostgreSQL.                                          |
| Stop database            | `pnpm docker:down`                     | Stop local PostgreSQL without deleting its volume.               |
| Reset database container | `pnpm docker:reset`                    | Remove the local volume and start a clean database. Destructive. |
| Prepare database         | `pnpm db:setup`                        | Generate Prisma, apply committed migrations, and seed demo data. |
| Develop                  | `pnpm dev`                             | Run API and web in parallel.                                     |
| Format check             | `pnpm format:check`                    | Verify repository formatting.                                    |
| Lint                     | `pnpm lint`                            | Run lint checks across API, client, and web workspaces.          |
| Typecheck                | `pnpm typecheck`                       | Type-check the TypeScript workspaces.                            |
| Test                     | `pnpm test`                            | Run API and web test suites.                                     |
| Coverage                 | `pnpm test:coverage`                   | Run coverage-enforced API and web tests.                         |
| E2E                      | `pnpm --filter @parkcore/web test:e2e` | Run the default mocked browser workflow.                         |
| Generate contract        | `pnpm contract:generate`               | Regenerate OpenAPI and the TypeScript API client.                |
| Verify contract          | `pnpm contract:check`                  | Fail if regenerated contract artifacts differ from Git.          |
| Build                    | `pnpm build`                           | Generate the contract and build API, client, and web.            |
| Release checks           | `pnpm release:readiness`               | Run lint, types, coverage, contract, build, and E2E checks.      |

A production-style web build requires `VITE_API_URL`.

## Workspace workflow

| Workspace              | Responsibility                              | Example                                    |
| ---------------------- | ------------------------------------------- | ------------------------------------------ |
| `@parkcore/api`        | Express API, Prisma, OpenAPI, backend tests | `pnpm --filter @parkcore/api test`         |
| `@parkcore/web`        | Public and owner React application          | `pnpm --filter @parkcore/web test`         |
| `@parkcore/api-client` | Generated TypeScript API contract           | `pnpm --filter @parkcore/api-client build` |

The generated files in `apps/api/openapi.json` and `packages/api-client/src/generated/schema.ts` should be regenerated through the contract scripts rather than edited manually.

## Database workflow

Start and prepare the local database:

```bash
pnpm docker:up
pnpm db:setup
```

`db:setup` performs:

1. Prisma client generation;
2. committed migration deployment;
3. demo seeding.

Schema changes use committed forward migrations. Use Prisma development commands from the API workspace when creating a new migration, and never edit an already-applied migration to change history.

`pnpm docker:reset` deletes the local PostgreSQL volume. Use it only for disposable local data.

## Demo seed

The seed provides a coherent development/demo state around a named owner and a small set of parking facilities. It includes active, completed, and cancelled sessions and pricing snapshots so both the public and owner flows have meaningful data.

The seed is designed for development/demo use, not production data.

An optional `SEED_REFERENCE_TIME` can be used when reproducible session timestamps are needed.

## Dependency note

The root `pnpm.overrides` currently pins `deepmerge-ts` to `8.0.0` to replace a vulnerable transitive version pulled through the current Prisma dependency chain.

Treat the override as a temporary compatibility/security measure: verify `pnpm audit --prod` and the Prisma generate/build flow before changing or removing it.

## Related documentation

- [README](../README.md)
- [Project](PROJECT.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
