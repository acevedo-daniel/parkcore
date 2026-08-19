# ParkCore — Architecture

> System boundaries, dependency rules, contract flow, persistence model, and architectural trade-offs for ParkCore 1.0.

## Summary

ParkCore is a pnpm workspace monorepo with three application boundaries:

```mermaid
flowchart LR
    B[Browser] --> W[Vercel: apps/web]
    W --> A[Render: apps/api]
    A --> D[(Neon PostgreSQL)]
    O[apps/api/openapi.json] -. generates .-> C[packages/api-client]
    C -. typed browser contract .-> W
```

The API owns domain rules and persistence. The browser application owns presentation and client state. The generated `@parkcore/api-client` is the contract boundary between them.

## Workspace boundaries

| Workspace             | Owns                                                                                         | Must not own                                      |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/api`            | HTTP API, authentication, domain rules, Prisma persistence, OpenAPI registrations, API tests | Browser UI or frontend state                      |
| `apps/web`            | Routing, providers, public/owner UI, browser auth state, server-state consumption            | Prisma, API internals, duplicated backend DTOs    |
| `packages/api-client` | Generated contract types and typed HTTP client construction                                  | Domain rules, browser token persistence, React UI |

These boundaries are intentional: the web application communicates with the backend through `@parkcore/api-client` rather than importing API code or persistence types.

## API structure

The API follows a direct dependency flow:

```text
route -> controller -> service -> repository -> Prisma/PostgreSQL
```

- **Routes** compose HTTP endpoints and middleware.
- **Controllers** treat HTTP input as untrusted transport and validate params, query, and bodies with Zod schemas.
- **Services** enforce authorization and business rules.
- **Repositories** own Prisma persistence operations and transactions.
- **Response mapping/OpenAPI registrations** define the public HTTP representation.

This separation keeps transport concerns away from persistence and makes the API the authoritative domain boundary.

## Persistence and concurrency

PostgreSQL is the persistence source of truth. Prisma provides the schema, generated client, and committed forward migrations.

The main operational concurrency boundary is check-in. Creating an active session:

1. counts current active sessions for the parking;
2. rejects intake when capacity has been reached;
3. verifies that the same parking/vehicle pair has no active session;
4. creates the session with a rate and currency snapshot;

inside a Prisma transaction using PostgreSQL `Serializable` isolation.

A partial unique database index on `(parkingId, vehicleId)` where `status = 'ACTIVE'` provides a second persistence-level guard against duplicate active sessions.

Checkout and cancellation use conditional updates against `status = 'ACTIVE'`, so only one terminal transition can succeed.

## Contract flow

The API's OpenAPI registrations generate the artifact consumed by the browser client:

```text
API OpenAPI registrations
  -> pnpm --filter @parkcore/api generate:openapi
  -> apps/api/openapi.json
  -> pnpm --filter @parkcore/api-client generate
  -> packages/api-client/src/generated/schema.ts
  -> typed web client
```

The generated OpenAPI artifact and generated TypeScript schema are versioned.

`pnpm contract:check` regenerates both and fails when Git detects a diff. API contract changes therefore have to be committed together with their generated client representation.

## Web architecture

`apps/web` is a client-rendered React/Vite application.

Its main state boundaries are:

- **React Router:** routing and route-level navigation.
- **TanStack Query:** server state, caching, invalidation, and request lifecycle.
- **URL search parameters:** shareable catalog/history filters and pagination.
- **Local React state:** transient component and interaction state.
- **React Hook Form + Zod:** form state and client-side validation.

The web application persists the owner's access token in browser `localStorage` and supplies it to the generated API client. Authorization remains enforced by the API on every protected request.

## Hosted topology

Production keeps a small, explicit topology:

```text
Browser
  -> Vercel static web
  -> Render Express API
  -> Neon PostgreSQL
```

Only the API connects to the production database.

The Vercel build receives the public `VITE_API_URL`. Render receives backend runtime configuration and secrets such as `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS`.

Provider-specific SDKs are not part of the application architecture; hosting configuration stays at the deployment boundary.

## Invariants

- **API authority:** browser state is never trusted as authorization or domain truth.
- **Parking ownership:** protected parking/session operations are scoped to the authenticated owner.
- **Contract boundary:** the web application consumes the API through the generated client.
- **Persistence authority:** PostgreSQL constraints and transactions reinforce critical session invariants.
- **Pricing history:** a session owns the pricing snapshot used to calculate its completed total.
- **Terminal sessions:** completed or cancelled sessions do not transition again.

## Trade-offs

### Browser token persistence

The access token is stored in `localStorage` so an owner session survives a browser refresh. This keeps ParkCore 1.0 authentication simple, but a successful same-origin XSS attack could read that token until it expires.

The current frontend avoids unsafe HTML rendering, relies on React escaping, and the production web configuration applies a Content Security Policy. Moving to cookie-based sessions or refresh-token rotation would change the authentication model and is intentionally outside 1.0 release polish.

### Monorepo with independently deployed surfaces

API, web, and generated client live in one workspace, which makes contract synchronization and shared verification straightforward. The API and web remain independently deployable, so the repository does not require a shared runtime or a server-side frontend.

### Generated contract artifacts are committed

Committing generated OpenAPI/client artifacts introduces generated diffs, but makes API/client changes reviewable and lets CI detect drift deterministically.

## Related documentation

- [README](../README.md)
- [Project](PROJECT.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
