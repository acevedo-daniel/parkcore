# Architecture

ParkCore API is organized around a small layered backend structure:

```text
routes -> controller -> service -> repository
```

## Domain Boundary

The application is an operational backend for parking-facility owners. Authentication identifies the facility owner who performs operational actions; there is no customer account, staff role, payment record, or reservation flow in the current model.

```text
User (owner) 1 --- * Parking 1 --- * Vehicle
                              |             |
                              *             *
                           Review       Booking
```

`Booking` is the historical record of an on-site vehicle stay. A `Vehicle` is scoped to the parking facility that registered it, and is not related to `User`. The detailed current domain map and unresolved semantics are maintained in [PROJECT.md](PROJECT.md).

## Runtime

- `server.ts` starts the HTTP server and handles graceful shutdown.
- `app.ts` builds the Express app, middleware pipeline, routes, docs, and error handler.
- `src/config/env.ts` validates environment variables on startup.
- `src/config/prisma.ts` creates the Prisma client.

## Request Flow

1. Request logger attaches or propagates `x-request-id`.
2. `helmet` and CORS run before body parsing.
3. JSON and URL-encoded bodies are limited to `10kb`.
4. Route middleware validates params, query, and body with Zod.
5. Controllers handle HTTP concerns only.
6. Services enforce authorization and business rules.
7. Repositories isolate Prisma persistence.
8. Errors are normalized by the global error handler.

## Feature Shape

Each feature follows:

```text
feature.routes.ts
feature.controller.ts
feature.service.ts
feature.repository.ts
feature.schema.ts
feature.docs.ts
```

## Key Decisions

- Express 5 async errors are forwarded to the global error handler.
- Auth-required controllers call `requireUser(req)` before reading `req.user`.
- Zod schemas validate inputs and generate OpenAPI contracts.
- Booking check-in keeps capacity and active-vehicle checks inside a serializable transaction.
- Logs use Pino with redaction for passwords, tokens, and authorization headers.

## Persistence Lifecycle

Prisma is the source of truth. Deleting a `User` cascades to owned parkings; deleting a `Parking` cascades to its vehicles, bookings, and reviews; deleting a `Vehicle` cascades to its bookings. The HTTP API currently exposes no delete operations, so these cascades are relevant to direct database administration and future deletion features.
