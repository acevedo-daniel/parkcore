# AGENTS.md

## API

This workspace owns the ParkCore 1.0 HTTP API, Prisma schema and migrations, generated OpenAPI document, and backend tests.

## Rules

- Preserve the flow routes -> controllers -> services -> repositories.
- Express `Request` is untrusted transport. Controllers use colocated Zod schemas to parse params, query, and body, then pass inferred inputs to services.
- Controllers own HTTP, parsing, auth context, and response status. Services own authorization and business rules. Repositories own Prisma access.
- Use `getAuthenticatedUserId(req)` in controllers. Map persistence data explicitly before returning JSON; timestamps are ISO-8601 strings.
- Do not edit `prisma/generated/` manually. Run `pnpm prisma:generate`, `pnpm db:setup`, or `pnpm build` only from this workspace or through their root delegates.
- Add only forward migrations. Never edit applied migration history.
- Keep `openapi.json` generated through `pnpm generate:openapi`; it feeds `@parkcore/api-client`.

## Domain

- A `User` owns parkings. No customer accounts, staff, roles, reservations, payments, or reviews exist in 1.0.
- A parking is active or inactive. Only active parkings are public and accept check-ins.
- A vehicle is parking-scoped with canonical normalized plate identity.
- A parking session owns visit data and transitions `ACTIVE -> COMPLETED | CANCELLED`. Capacity and active-vehicle checks are transactional; terminal transitions are atomic.
- Rates and totals use USD integer cents, and sessions snapshot rate and currency at check-in.

See `../../docs/PROJECT.md` for permanent product rules.
