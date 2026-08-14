# AGENTS.md

## Project

ParkCore is a personal TypeScript API for owner-operated parking facilities with a read-only public catalog of active parkings. Its permanent 1.0 product decisions are in `docs/PROJECT.md`; do not infer reservations, payments, reviews, customer accounts, staff, roles, or physical-slot features.

## Repository Map

- `src/features/` — HTTP features: routes, controllers, services, repositories, schemas, and OpenAPI registrations.
- `prisma/` — schema, forward migrations, seed, and generated client output.
- `src/docs/` — OpenAPI registry assembly.
- `docs/` — active ParkCore documentation only.
- `tests/` and `src/**/*.test.ts` — Vitest tests and shared helpers.

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
- Treat Express `Request` as untrusted transport. Controllers parse params, query, and body with colocated Zod schemas, then pass inferred input to services.
- Controllers own HTTP, parsing, authentication context, and response status. Services own authorization and business rules; repositories own Prisma access.
- Use `getAuthenticatedUserId(req)` when a controller needs the authenticated user.
- Map persistence data explicitly before returning it over HTTP. JSON timestamps are ISO-8601 strings.
- Do not edit or commit `prisma/generated/`; `pnpm install` and `pnpm build` run `prisma generate`.
- Preserve unrelated user changes. Do not commit, push, deploy, or modify remote databases unless explicitly requested.

## Domain Boundaries

- A user owns and operates parking facilities; no additional roles exist.
- A vehicle belongs to a parking, not a user, and stores only stable identity and metadata.
- A parking session owns visit-specific customer/contact/notes data and follows `ACTIVE -> COMPLETED | CANCELLED`.
- Capacity is the maximum concurrent active sessions. Check-in capacity and active-vehicle checks run serializably; the database prevents duplicate active parking/vehicle pairs.
- Checkout and cancellation atomically transition only an `ACTIVE` session.
- USD is the only supported 1.0 currency.
- Before changing persistence, add a forward migration; never edit an applied migration.

## Verification

For code or API-contract work, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm openapi:check
pnpm build
pnpm release:readiness
```

Report checks that were not run or did not pass.

## Documentation

Keep this personal project lean:

- `README.md` is onboarding.
- `docs/PROJECT.md` is product scope and domain rules.
- `docs/ARCHITECTURE.md` is technical structure.
- Generated OpenAPI is the HTTP contract.

Create documentation only when it establishes a source of truth or makes the project reproducible. Do not duplicate endpoint details in Markdown.
