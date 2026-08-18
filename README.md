# ParkCore

> A focused parking-operations system for independent parking owners.

ParkCore makes the daily state of a parking facility explicit: capacity, vehicle check-ins, active stays, and charged totals. It exists as a small operational product for owners who need to run a facility, not a marketplace for reservations or payments.

- **Owners** manage their facilities, activate or deactivate them, monitor occupancy, start sessions, and complete or cancel stays.
- **Public visitors** can discover active facilities, search by address or rate, and inspect parking details. They cannot reserve or pay.

## Demo

[Live web app](https://parkcore-app.vercel.app/) · [API health](https://parkcore-api.onrender.com/healthz)

## Screenshots

### Public discovery

![ParkCore public landing page with the parking operations overview](docs/screenshots/public-home.png)

![ParkCore public parking catalog filtered to fictional demo facilities](docs/screenshots/public-catalog.png)

### Owner operations

![ParkCore owner parking overview with live occupancy and active sessions](docs/screenshots/owner-parking-overview.png)

| Check-in flow                                                                                           | Checkout summary                                                                                                |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![ParkCore owner check-in sheet with vehicle and visit information](docs/screenshots/check-in-flow.png) | ![ParkCore checkout dialog with the rate snapshot and final calculation](docs/screenshots/checkout-summary.png) |

## Key features

- Discover active parkings by address and hourly rate.
- Create and operate owner-controlled parkings, including activation and deactivation.
- Check in a vehicle using its parking-scoped normalized plate identity.
- Enforce active-session capacity and complete or cancel sessions safely.
- Preserve each session's USD hourly-rate snapshot and calculated total.

## Architecture

```text
Browser -> Vercel web -> @parkcore/api-client -> Render API -> Neon PostgreSQL
```

The API is the domain and persistence authority. `apps/web` consumes it only through the generated `@parkcore/api-client`; OpenAPI generation and contract checks keep that boundary synchronized. See [Architecture](docs/ARCHITECTURE.md) for the dependency rules.

## Technology stack

- **Web:** React, Vite, React Router, TanStack Query, React Hook Form, and Zod.
- **API:** Node.js, Express 5, Prisma, PostgreSQL, Zod, and OpenAPI.
- **Tooling:** pnpm workspaces, Vitest, Playwright, ESLint, Prettier, and Docker Compose.

## Repository structure

| Path                  | Responsibility                                                                  |
| --------------------- | ------------------------------------------------------------------------------- |
| `apps/api`            | Express API, Prisma schema/migrations, OpenAPI artifact, and API tests.         |
| `apps/web`            | Public discovery and owner operations React application.                        |
| `packages/api-client` | Generated OpenAPI types and typed browser API client.                           |
| `docs`                | Product, architecture, development, testing, deployment, and design references. |

## Local setup

Prerequisites: Node.js 24, pnpm 10, and Docker Desktop.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
pnpm install
pnpm docker:up
pnpm db:setup
pnpm dev
```

On macOS or Linux, replace `Copy-Item` with `cp`. The API starts at `http://localhost:3000`; the web application normally starts at `http://localhost:5173`.

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm --filter @parkcore/web test:e2e
pnpm contract:check
pnpm build
```

`pnpm build` requires `VITE_API_URL`; the local web `.env` supplies it after setup. See [Testing](docs/TESTING.md) for test layers, real-stack checks, coverage, and required release verification.

## Documentation

- [Project](docs/PROJECT.md) — product scope and locked domain rules.
- [Architecture](docs/ARCHITECTURE.md) — system boundaries and dependency rules.
- [Development](docs/DEVELOPMENT.md) — local environment and workspace workflow.
- [Testing](docs/TESTING.md) — test strategy and release checks.
- [Deployment](docs/DEPLOYMENT.md) — production configuration, migrations, and validation.
- [Web design](docs/WEB-DESIGN.md) — implemented frontend direction.
