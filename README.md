# ParkCore API

Backend API for parking-facility operations. A signed-in facility owner manages parking locations and records vehicle check-ins, check-outs, and visit history. Built with TypeScript, Express 5, Prisma, PostgreSQL, JWT auth, Zod validation, and OpenAPI documentation.

## Highlights

- Layered architecture: routes, controllers, services, repositories
- Strict TypeScript across app code, scripts, and tests
- Zod schemas reused for request validation and OpenAPI generation
- JWT authentication with Argon2 password hashing
- Transactional vehicle check-in flow with concurrent capacity protection
- Public review creation with rate limiting
- Global error handler with a stable JSON error contract
- CI gate for lint, typecheck, coverage, OpenAPI, and build readiness

## Stack

| Area       | Choice               |
| ---------- | -------------------- |
| Runtime    | Node.js 22           |
| API        | Express 5            |
| Database   | PostgreSQL           |
| ORM        | Prisma               |
| Validation | Zod                  |
| Auth       | JWT + Argon2         |
| Docs       | OpenAPI 3.1 + Scalar |
| Tests      | Vitest + Supertest   |

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:setup
pnpm dev
```

Local services:

- API: `http://localhost:3000`
- API docs: `http://localhost:3000/docs`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

Production:

- API: <https://parkcore-api.onrender.com/>
- API docs: <https://parkcore-api.onrender.com/docs>

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm quality:ci
pnpm release:readiness
```

## Current Domain

The current implementation is an owner-operated parking system, not a customer reservation marketplace:

- Every authenticated `User` may own one or more `Parking` facilities.
- A `Vehicle` is a visiting customer vehicle recorded within one parking facility; it is not owned by a `User`.
- A `Booking` is the operational record of a vehicle stay. It begins at check-in and ends at check-out or cancellation.
- `Review` is public, anonymous-or-named feedback about a parking facility.

See [Project and domain map](docs/PROJECT.md) for the implemented scope, relationships, known inconsistencies, and product decisions that must precede model changes.

## API Surface

| Module   | Endpoints                                      |
| -------- | ---------------------------------------------- |
| System   | `GET /`, `GET /healthz`                        |
| Auth     | `POST /auth/register`, `POST /auth/login`      |
| Users    | `GET /users/me`, `PATCH /users/me`             |
| Parkings | create, list, read, update, owner listing      |
| Vehicles | create and lookup by plate per parking         |
| Bookings | check-in, check-out, cancel, list, active list |
| Reviews  | create, list, rating stats                     |

## Design Notes

Check-in uses a serializable transaction to keep active vehicle and parking capacity checks in the same write path.

Input validation happens at route boundaries with Zod. Response schemas are used for OpenAPI contract generation.

Production CORS requires an explicit `CORS_ORIGINS` allowlist. API docs are hidden in production unless `ENABLE_API_DOCS=true`.

## Project Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API Design](docs/API-DESIGN.md)
- [Conventions](docs/CONVENTIONS.md)
- [Project and Domain Map](docs/PROJECT.md)
