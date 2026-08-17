# Architecture

## Summary

ParkCore is a pnpm workspace monorepo. It keeps the API independently deployable, gives the frontend a small modern foundation, and makes the published OpenAPI document the sole contract bridge between them.

```mermaid
flowchart LR
    W[apps/web] --> C[packages/api-client]
    C --> O[apps/api/openapi.json]
    O --> A[apps/api]
    A --> D[(PostgreSQL)]
```

## Workspace boundaries

| Workspace             | Owns                                                                         | Must not own                               |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/api`            | HTTP API, domain rules, Prisma persistence, OpenAPI registrations, API tests | Browser UI or frontend state               |
| `apps/web`            | Browser routing, providers, user interface, server-state consumption         | API internals, Prisma, duplicate HTTP DTOs |
| `packages/api-client` | Generated contract types and typed fetch-client construction                 | Domain rules, token storage, React UI      |

The web app consumes the API only through `@parkcore/api-client`. The client injects bearer authentication through a caller-provided callback; it does not choose or persist browser token storage.

## API internals

The API keeps its dependency flow:

```text
route -> controller -> service -> repository -> Prisma
```

Express requests are untrusted transport. Controllers parse params, query, and body with colocated Zod schemas; services enforce authorization and business rules; repositories perform Prisma operations. Explicit response mappers produce the JSON/OpenAPI contract, including ISO-8601 timestamps.

PostgreSQL is the persistence source of truth. Prisma schema changes use forward migrations only. Prisma generated output is ignored by Git and generated explicitly during API build or database setup.

## Contract flow

```text
OpenAPI registrations in apps/api
  -> pnpm --filter @parkcore/api generate:openapi
  -> apps/api/openapi.json
  -> pnpm --filter @parkcore/api-client generate
  -> packages/api-client/src/generated/schema.ts
  -> typed openapi-fetch consumer
```

Both generated contract artifacts are versioned. `pnpm contract:check` regenerates them and fails on a diff, so contract changes are reviewed together with the API implementation.

## Frontend foundation

`apps/web` uses Vite, React, React Compiler, React Router Data Mode, TanStack Query, and Tailwind 4. It intentionally has only an application provider, router, neutral route, and global style baseline. Product features, design system components, authentication storage, and screens are deferred until there is a real frontend requirement.

## Local development and CI

Root Docker Compose runs a local `parkcore-db` PostgreSQL container only. API and web processes run with root pnpm orchestration and retain independent workspace scripts.

CI has separate API, web, and contract jobs. The API job provisions PostgreSQL and runs API-specific quality/readiness checks; web checks do not boot a database; the contract job detects generated-type drift.
