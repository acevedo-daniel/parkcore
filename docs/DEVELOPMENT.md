# Development

> Local setup and the environment boundary for ParkCore 1.0.

## Requirements

| Tool           | Required version | Source               |
| -------------- | ---------------- | -------------------- |
| Node.js        | 24.x             | Root `package.json`  |
| pnpm           | 10.33.0          | Root `package.json`  |
| Docker Desktop | Local PostgreSQL | `docker-compose.yml` |

## Initial setup

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp` instead of `Copy-Item`. Docker Compose starts only the local PostgreSQL service; API and web processes run from the host.

## Environment boundary

`.env` files are ignored. Copy the examples, keep real credentials outside version control, and never place a secret in a `VITE_*` variable.

### Local development

`apps/api/.env` is the API runtime configuration. The example contains the complete local variable set:

| Variable                    | Required locally | Purpose                                                                                  |
| --------------------------- | :--------------: | ---------------------------------------------------------------------------------------- |
| `NODE_ENV`                  |        No        | Runtime mode; defaults to `development`.                                                 |
| `PORT`                      |        No        | API port; defaults to `3000`.                                                            |
| `DATABASE_URL`              |       Yes        | Local PostgreSQL connection.                                                             |
| `JWT_SECRET`                |       Yes        | Access-token signing secret; at least 32 characters.                                     |
| `CORS_ORIGINS`              |        No        | Comma-separated exact HTTP(S) browser origins; no paths, trailing slashes, or wildcards. |
| `JWT_EXPIRES_IN`            |        No        | Access-token lifetime; defaults to `24h`.                                                |
| `AUTH_RATE_LIMIT_MAX`       |        No        | Maximum auth requests per window; defaults to `15`.                                      |
| `AUTH_RATE_LIMIT_WINDOW_MS` |        No        | Auth rate-limit window; defaults to `900000`.                                            |
| `LOG_LEVEL`                 |        No        | Pino log level; defaults to `info`.                                                      |
| `LOG_PRETTY`                |        No        | Pretty local logs; defaults to `false`.                                                  |
| `ENABLE_API_DOCS`           |        No        | Explicitly enables API reference in production; defaults to `false`.                     |

`apps/web/.env` has one browser-safe variable:

| Variable       | Required locally | Purpose                                                                |
| -------------- | :--------------: | ---------------------------------------------------------------------- |
| `VITE_API_URL` |        No        | API base URL. Local development falls back to `http://localhost:3000`. |

### API production

Set these API runtime variables in the deployment platform's secret/configuration store:

| Variable                                                                                                           | Required | Production rule                                                                      |
| ------------------------------------------------------------------------------------------------------------------ | :------: | ------------------------------------------------------------------------------------ |
| `NODE_ENV`                                                                                                         |   Yes    | Must be `production`.                                                                |
| `DATABASE_URL`                                                                                                     |   Yes    | Production PostgreSQL connection string.                                             |
| `JWT_SECRET`                                                                                                       |   Yes    | Unique secret of at least 32 characters.                                             |
| `CORS_ORIGINS`                                                                                                     |   Yes    | Comma-separated exact allowed web origins; no paths, trailing slashes, or wildcards. |
| `PORT`                                                                                                             |    No    | Defaults to `3000`; set it only when the host requires a port.                       |
| `JWT_EXPIRES_IN`, `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `LOG_LEVEL`, `LOG_PRETTY`, `ENABLE_API_DOCS` |    No    | Use defaults unless the deployment requires a deliberate override.                   |

The API does not consume `API_BASE_URL`. Docker's `POSTGRES_*` values are fixed local Compose settings, not API production variables.

In local development, the API explicitly allows browser origins so Vite and local tools can use different ports. In production, only origins in `CORS_ORIGINS` are accepted; malformed or missing configuration prevents startup. Requests without an `Origin` header, such as health checks or server-to-server traffic, are allowed because CORS does not apply to them.

### Web production

Set `VITE_API_URL` to the deployed API's public base URL during the web build. It is public, embedded in the browser bundle, and required in production; the application fails fast if it is absent. Do not place database URLs, JWT secrets, or any other secret in the web environment.

## Run locally

```bash
pnpm dev
```

- API: `http://localhost:3000`
- API reference: `http://localhost:3000/docs`
- Web: Vite's local URL, normally `http://localhost:5173`

## Commands

| Task                 | Command                                | Notes                                                       |
| -------------------- | -------------------------------------- | ----------------------------------------------------------- |
| Start local database | `pnpm docker:up`                       | Starts the `parkcore-db` container.                         |
| Prepare database     | `pnpm db:setup`                        | Generates Prisma, applies migrations, and seeds local data. |
| Develop              | `pnpm dev`                             | Runs API and web from the host.                             |
| Test                 | `pnpm test`                            | Runs API and web unit/integration tests.                    |
| Browser workflow     | `pnpm --filter @parkcore/web test:e2e` | Uses mocked contract-shaped responses.                      |
| Verify contract      | `pnpm contract:check`                  | Detects OpenAPI/client drift.                               |
| Release checks       | `pnpm release:readiness`               | Lint, types, coverage, contract, build, and E2E.            |

## Workspace workflow

| Workspace             | Responsibility                          | Common command                         |
| --------------------- | --------------------------------------- | -------------------------------------- |
| `apps/api`            | API, Prisma, OpenAPI, and backend tests | `pnpm --filter @parkcore/api <script>` |
| `apps/web`            | Public and owner React application      | `pnpm --filter @parkcore/web <script>` |
| `packages/api-client` | Generated API contract client           | `pnpm contract:generate`               |

The web application uses only `@parkcore/api-client`; it must not import API internals. Regenerate contract artifacts rather than editing generated schema types manually.

## Database workflow

```bash
pnpm docker:up
pnpm db:setup
```

Use `pnpm docker:down` to stop the local database. `pnpm docker:reset` removes its local volume and is destructive; never use it against valuable data. Prisma changes use forward migrations only.

## Related documentation

- [README](../README.md)
- [Project](PROJECT.md)
- [Architecture](ARCHITECTURE.md)
