# ParkCore

ParkCore is a personal parking-operations application for parking owners. It is a pnpm monorepo containing the ParkCore 1.0 API, a deliberately minimal React frontend foundation, and a typed client generated from the API's OpenAPI contract.

There are no marketplace transactions, reservations, payments, customer accounts, staff, roles, reviews, or physical-slot features in 1.0.

## Workspaces

| Workspace             | Responsibility                                                                  |
| --------------------- | ------------------------------------------------------------------------------- |
| `apps/api`            | Express 5 API, Prisma schema/migrations, OpenAPI artifact, and backend tests.   |
| `apps/web`            | Vite, React, React Router Data Mode, TanStack Query, and Tailwind 4 foundation. |
| `packages/api-client` | Generated OpenAPI types and typed `openapi-fetch` bridge for browser consumers. |

## Requirements

- Node.js 24
- pnpm 10
- Docker Desktop for local PostgreSQL

## Local development

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp` instead of `Copy-Item`.

`pnpm install` does not require API environment variables or generate Prisma code. API database setup and builds generate Prisma explicitly. Docker Compose starts only the local `parkcore-db` PostgreSQL container; both applications run from the host.

- API: `http://localhost:3000`
- API reference: `http://localhost:3000/docs`
- Web: Vite's default local URL (normally `http://localhost:5173`)

## Common commands

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm db:setup
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm contract:generate
pnpm contract:check
pnpm build
pnpm release:readiness
```

`pnpm contract:generate` writes `apps/api/openapi.json` and regenerates `packages/api-client/src/generated/schema.ts`. Generated contract types are committed and must not be edited manually; `pnpm contract:check` detects drift.

## Documentation

- [Project](docs/PROJECT.md) — product scope and permanent domain rules.
- [Architecture](docs/ARCHITECTURE.md) — workspace boundaries and technical structure.
- [API reference](http://localhost:3000/docs) — endpoint contract while the API is running.
