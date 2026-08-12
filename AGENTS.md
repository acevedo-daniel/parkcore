# AGENTS.md

## Project

ParkCore is a TypeScript API for owner-operated parking facilities. The implemented core workflow records vehicle stays through check-in and check-out; it is not currently an advance-reservation system.

## Repository Map

- `src/features/` — feature modules with routes, controllers, services, repositories, schemas, and OpenAPI registrations.
- `prisma/schema.prisma` and `prisma/migrations/` — database model and migration history.
- `src/docs/` — generated OpenAPI registration helpers.
- `docs/` — active project documentation; `docs/templates/` is a reusable template library.
- `tests/` and `src/**/*.test.ts` — Vitest tests and shared test helpers.

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Develop | `pnpm dev` |
| Test | `pnpm test` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Build | `pnpm build` |
| OpenAPI check | `pnpm openapi:check` |
| Release readiness | `pnpm release:readiness` |

## Engineering Rules

- Follow the existing route → controller → service → repository boundary.
- Validate external input with the feature's Zod schema and keep OpenAPI registration aligned with it.
- Put authorization and domain rules in services; keep Prisma access in repositories.
- Do not edit files in `prisma/generated/` manually.
- Preserve the booking invariants: only a parking owner operates its vehicles and bookings; a confirmed booking occupies capacity; check-in capacity and active-vehicle checks must remain transactional.
- Do not weaken validation, security, tests, or error contracts to make a change pass.
- Preserve unrelated user changes. Do not commit, push, deploy, or run destructive database commands unless explicitly requested.

## Verification

Run the checks relevant to the change. For code or contract changes, prefer:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm openapi:check
```

Report any check that was not run or did not pass.

## Documentation

`README.md` is the onboarding entry point. `docs/PROJECT.md` is the source of truth for implemented scope, domain meaning, and pending product decisions. `docs/ARCHITECTURE.md` covers technical structure, and generated OpenAPI is the endpoint-level contract.

Create or update documentation only when it clarifies actual behavior or a reproducible workflow. Do not create empty documents or duplicate the generated API contract.
