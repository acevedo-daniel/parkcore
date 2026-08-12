# AGENTS.md

## Project

ParkCore is a personal TypeScript API for owner-operated parking facilities. Its 1.0 domain target is documented in `docs/PROJECT.md`; do not infer customer accounts, roles, reservations, payments, or staff features.

## Repository Map

- `src/features/` - HTTP features: routes, controllers, services, repositories, schemas, and OpenAPI registrations.
- `prisma/` - Prisma schema, forward migrations, seed, and generated client output.
- `src/docs/` - OpenAPI registry assembly.
- `docs/` - active documentation; `docs/templates/` is the reusable template library.
- `tests/` and `src/**/*.test.ts` - Vitest tests and shared helpers.

## Commands

| Task              | Command                  |
| ----------------- | ------------------------ |
| Install           | `pnpm install`           |
| Develop           | `pnpm dev`               |
| Test              | `pnpm test`              |
| Lint              | `pnpm lint`              |
| Typecheck         | `pnpm typecheck`         |
| Build             | `pnpm build`             |
| OpenAPI check     | `pnpm openapi:check`     |
| Release readiness | `pnpm release:readiness` |

## Engineering Rules

- Keep the dependency flow: routes -> controllers -> services -> repositories.
- Treat Express `Request` as untrusted transport. Parse params, query, and body with colocated Zod schemas in the controller, then pass inferred input to services.
- Controllers own HTTP, parsing, authentication context, and response status. Services own authorization and business rules; repositories own Prisma access.
- Use `getAuthenticatedUserId(req)` when a controller needs the authenticated user.
- Do not edit `prisma/generated/` manually.
- Preserve unrelated user changes. Do not commit, push, deploy, or run destructive database commands unless explicitly requested.

## Domain Boundaries

- A user owns and operates parking facilities; no additional roles exist in 1.0.
- A vehicle belongs to a parking, not a user.
- The future `ParkingSession` lifecycle is `ACTIVE -> COMPLETED | CANCELLED`; it is not a reservation workflow.
- Capacity is the maximum concurrent active sessions. Keep check-in capacity and active-vehicle checks transactional.
- Before changing domain persistence, follow the approved migration policy in `docs/PROJECT.md`.

## Verification

Run checks relevant to the change. For code or API-contract work, prefer:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm openapi:check
pnpm build
```

Report checks that were not run or did not pass.

## Documentation

Keep this personal project lean:

- `README.md` is onboarding.
- `docs/PROJECT.md` is scope, domain decisions, and migration policy.
- `docs/ARCHITECTURE.md` is technical structure.
- Generated OpenAPI is the HTTP contract.

Create documentation only when it establishes a source of truth or makes the project reproducible. Do not duplicate the endpoint contract in Markdown.
