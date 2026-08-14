# ParkCore API

ParkCore is a parking operations management API for parking owners. It provides a read-only public catalog of active parking facilities and an authenticated owner workspace for operating them.

## Product Surfaces

- **Public catalog:** list, search, filter, and view active parking facilities.
- **Owner operations:** register and log in, manage a profile, create and update owned parkings, activate or deactivate them, and manage vehicle stays.

There are no public reservations, marketplace transactions, payments, customer accounts, employees, or reviews.

## Stack

- **Runtime:** Node.js 24 and TypeScript
- **HTTP API:** Express 5, Zod, and Scalar/OpenAPI 3.1
- **Data:** PostgreSQL and Prisma
- **Quality:** Vitest, Supertest, ESLint, and Prettier

## Quick Start

### Requirements

- Node.js 24
- pnpm 10
- Docker Desktop for local PostgreSQL

### Install and Run

```powershell
Copy-Item .env.example .env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, use `cp .env.example .env`.

`pnpm docker:up` starts only the local PostgreSQL container `parkcore-db`. `pnpm install` and `pnpm build` run `prisma generate`, so `DATABASE_URL` must be available before either command. Generated Prisma output is ignored by Git.

The local API runs at `http://localhost:3000`; its OpenAPI reference is at `http://localhost:3000/docs`. `.env.example` is the canonical list of environment variables.

## Common Commands

```bash
pnpm test
pnpm test:coverage
pnpm typecheck
pnpm openapi:check
pnpm release:readiness
```

## Documentation

- [Project](docs/PROJECT.md) — product scope and permanent domain rules.
- [Architecture](docs/ARCHITECTURE.md) — runtime boundaries and technical structure.
- [OpenAPI reference](http://localhost:3000/docs) — endpoint contract after the API is running.

ParkCore 1.0 models each vehicle stay as a `ParkingSession`. The API exposes the direct `/sessions` contract; compatibility routes and aliases are not supported.
