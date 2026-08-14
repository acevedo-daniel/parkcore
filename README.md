# ParkCore API

An operational API for parking-facility owners. ParkCore records vehicle stays, manages facility capacity, and exposes an OpenAPI contract for its HTTP interface.

## Features

- Owner authentication and profile management with JWT and Argon2.
- Parking-facility management and transactional vehicle check-in/check-out with parking-scoped vehicle recognition.
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
- Docker Desktop, for local PostgreSQL

### Install and Run

```powershell
Copy-Item .env.example .env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp .env.example .env` instead of `Copy-Item`.

`pnpm install` and `pnpm build` run `prisma generate`; `DATABASE_URL` must therefore be available through `.env` or the environment before either command. Generated Prisma output is not committed.

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

ParkCore 1.0 models a vehicle stay as a `ParkingSession`. The API uses the direct-breaking `/sessions` contract; compatibility routes and aliases are not supported.
