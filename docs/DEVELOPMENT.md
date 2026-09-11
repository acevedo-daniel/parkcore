# ParkCore - Development

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
pnpm install --frozen-lockfile
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

| Variable                             | Required locally | Purpose                                                                  |
| ------------------------------------ | :--------------: | ------------------------------------------------------------------------ |
| `NODE_ENV`                           |        No        | Runtime mode; local example uses `development`.                          |
| `PORT`                               |        No        | API port; defaults to `3000`.                                            |
| `CORS_ORIGINS`                       |        No        | Allowed browser origins; local example permits the Vite origin.          |
| `JWT_SECRET`                         |       Yes        | Access-token signing secret. Use the example only for local development. |
| `JWT_EXPIRES_IN`                     |        No        | Access-token lifetime; default is `24h`.                                 |
| `AUTH_RATE_LIMIT_MAX`                |        No        | Maximum authentication requests per rate-limit window.                   |
| `AUTH_RATE_LIMIT_WINDOW_MS`          |        No        | Authentication rate-limit window duration.                               |
| `DEMO_CREATION_RATE_LIMIT_MAX`       |        No        | Maximum isolated demo sandbox creations per rate-limit window.           |
| `DEMO_CREATION_RATE_LIMIT_WINDOW_MS` |        No        | Isolated demo creation rate-limit window duration.                       |
| `DEMO_CLEANUP_BATCH_SIZE`            |        No        | Maximum expired DEMO owners removed per cleanup operation.               |
| `DEMO_RESET_RATE_LIMIT_MAX`          |        No        | Maximum demo resets per rate-limit window.                               |
| `DEMO_RESET_RATE_LIMIT_WINDOW_MS`    |        No        | Demo reset rate-limit window duration.                                   |
| `LOG_LEVEL`                          |        No        | Pino log level.                                                          |
| `LOG_PRETTY`                         |        No        | Enables readable local logging.                                          |
| `ENABLE_API_DOCS`                    |        No        | Controls the API reference outside the normal development behavior.      |
| `DATABASE_URL`                       |       Yes        | PostgreSQL connection used by Prisma and the API.                        |

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

| Task                     | Command                                        | Purpose                                                                    |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Start database           | `pnpm docker:up`                               | Start local PostgreSQL.                                                    |
| Stop database            | `pnpm docker:down`                             | Stop local PostgreSQL without deleting its volume.                         |
| Reset database container | `pnpm docker:reset`                            | Remove the local volume and start a clean database. Destructive.           |
| Start isolated E2E DB    | `pnpm e2e:local:db:up`                         | Start the disposable PostgreSQL service for local real-stack E2E.          |
| Stop isolated E2E DB     | `pnpm e2e:local:db:down`                       | Remove the disposable PostgreSQL service and its data.                     |
| Prepare database         | `pnpm db:setup`                                | Generate Prisma, apply committed migrations, and seed OWNER/SHOWCASE data. |
| Clean expired demos      | `pnpm --filter @parkcore/api demo:cleanup`     | Remove one bounded batch of expired DEMO owners and dependent records.     |
| Refresh public showcase  | `pnpm --filter @parkcore/api showcase:refresh` | Rebase canonical SHOWCASE activity around an optional reference time.      |
| Develop                  | `pnpm dev`                                     | Run API and web in parallel.                                               |
| Format check             | `pnpm format:check`                            | Verify repository formatting.                                              |
| Authored text check      | `pnpm text:check`                              | Reject forbidden em dash characters in authored repository text.           |
| Design token check       | `pnpm tokens:check`                            | Verify locked light and dark token mappings and readable pairings.         |
| Lint                     | `pnpm lint`                                    | Run lint checks across API, client, and web workspaces.                    |
| Typecheck                | `pnpm typecheck`                               | Type-check the TypeScript workspaces.                                      |
| Test                     | `pnpm test`                                    | Run API and web test suites.                                               |
| Coverage                 | `pnpm test:coverage`                           | Run coverage-enforced API and web tests.                                   |
| E2E                      | `pnpm --filter @parkcore/web test:e2e`         | Run the default mocked browser workflow.                                   |
| Local real-stack E2E     | `pnpm --filter @parkcore/web test:e2e:local`   | Run the owner workflow against local API and PostgreSQL.                   |
| Generate contract        | `pnpm contract:generate`                       | Regenerate OpenAPI and the TypeScript API client.                          |
| Verify contract          | `pnpm contract:check`                          | Fail if regenerated contract artifacts differ from Git.                    |
| Build                    | `pnpm build`                                   | Generate the contract and build API, client, and web.                      |
| Release checks           | `pnpm release:readiness`                       | Run lint, types, coverage, contract, build, and E2E checks.                |

A production-style web build requires `VITE_API_URL`. For a reproducible verification checkout, use `pnpm install --frozen-lockfile`; CI uses the locked form in every job that installs dependencies.

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
3. canonical OWNER and SHOWCASE seeding. DEMO sandboxes are created through the demo-entry endpoint.

Schema changes use committed forward migrations. Use Prisma development commands from the API workspace when creating a new migration, and never edit an already-applied migration to change history.

`pnpm docker:reset` deletes the local PostgreSQL volume. Use it only for disposable local data.

## Verification troubleshooting

- If the local real-stack browser workflow cannot connect to PostgreSQL, start the isolated service with `pnpm e2e:local:db:up` and confirm Docker Desktop is running. Stop it with `pnpm e2e:local:db:down` after the run.
- If a production-style web build fails because the API URL is missing, set `VITE_API_URL` to the API base URL before running `pnpm build`. This value is browser-visible and must not contain secrets.
- If dependency installation reports a lockfile mismatch, do not update dependencies as part of a verification run. Reconcile the manifest and lockfile in a separate change, then rerun `pnpm install --frozen-lockfile`.

## Canonical data

The seed creates a named credentialed OWNER and the stable non-credentialed SHOWCASE identity. Both use the deterministic six-facility scenario with active, completed, and cancelled sessions, pricing snapshots, returning vehicles, and canonical Buenos Aires ARS data. SHOWCASE owns five listed active facilities and one paused unlisted facility; OWNER facilities remain unlisted.

The seed is designed for development/demo use, not production data. It is safe to rerun for the same identities. DEMO owners are created only by `POST /demo/login` and receive their own scenario inside the creation transaction. Reset preserves the original four-hour expiry. Expired DEMO owners are removed in bounded batches during demo creation or with `pnpm --filter @parkcore/api demo:cleanup`; neither path targets OWNER or SHOWCASE users. Protected requests for expired or deleted DEMO owners return `code=DEMO_EXPIRED`.

An optional `SEED_REFERENCE_TIME` can be used when reproducible session timestamps are needed. Run `pnpm --filter @parkcore/api showcase:refresh` to rebase only the canonical SHOWCASE records around the current time. Pass an ISO-8601 timestamp after `--`, or set `SHOWCASE_REFERENCE_TIME`, when a fixed reference time is required. Demo creation uses a four-hour TTL and the bounded cleanup limit configured by `DEMO_CLEANUP_BATCH_SIZE`.

## Dependency note

The root `pnpm.overrides` pins the audited transitive dependencies `deepmerge-ts` to `8.0.0`, `fast-uri` to `3.1.7`, `mysql2` to `3.23.1`, and `qs` to `6.16.0`.

Treat these overrides as compatibility and security measures: verify `pnpm audit --prod` and the Prisma generate/build flow before changing or removing them.

## Related documentation

- [README](../README.md)
- [Project](PROJECT.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
