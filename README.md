# ParkCore API

An operational API for parking-facility owners. ParkCore records vehicle stays, manages facility capacity, and exposes an OpenAPI contract for its HTTP interface.

## Features

- Owner authentication and profile management with JWT and Argon2.
- Parking-facility management, vehicle registration, and transactional vehicle check-in/check-out.
- Zod request validation, generated OpenAPI 3.1 documentation, and a stable JSON error contract.

## Stack

- **Runtime:** Node.js 22 and TypeScript
- **HTTP API:** Express 5, Zod, and Scalar/OpenAPI 3.1
- **Data:** PostgreSQL and Prisma
- **Quality:** Vitest, Supertest, ESLint, and Prettier

## Quick Start

### Requirements

- Node.js 22
- pnpm 10
- Docker Desktop, for local PostgreSQL and pgAdmin

### Install and Run

```powershell
pnpm install
Copy-Item .env.example .env
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp .env.example .env` instead of `Copy-Item`.

The local API runs at `http://localhost:3000`; its OpenAPI reference is at `http://localhost:3000/docs`. `.env.example` is the canonical list of environment variables.

## Common Commands

```bash
pnpm test
pnpm typecheck
pnpm openapi:check
pnpm release:readiness
```

## Documentation

- [Project](docs/PROJECT.md) - product scope, domain decisions, and the current migration plan.
- [Architecture](docs/ARCHITECTURE.md) - runtime boundaries, data model, and security constraints.
- [OpenAPI reference](http://localhost:3000/docs) - local endpoint contract after the API is running.

The current code still uses the legacy `Booking` name. The approved ParkCore 1.0 target is documented in `docs/PROJECT.md`; its direct breaking migration is intentionally pending implementation.
