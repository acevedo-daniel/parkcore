# AGENTS.md

## Workspace

ParkCore is a personal pnpm monorepo for owner-operated parking facilities. `apps/api` is the authoritative backend; `apps/web` is the frontend foundation; `packages/api-client` is the only supported browser-to-API contract bridge.

## Layout

- `apps/api/` — Express, Prisma, OpenAPI, and backend tests.
- `apps/web/` — Vite React application shell.
- `packages/api-client/` — generated OpenAPI types and typed `openapi-fetch` client.
- `docs/` — concise product and architecture sources of truth.
- `docker-compose.yml` — local PostgreSQL only.

## Workspace Rules

- Use root pnpm orchestration commands or `pnpm --filter <workspace> <script>`; do not add Turborepo, Nx, or a shared build framework.
- Keep runtime dependencies owned by the workspace that uses them.
- Do not import API internals from web code. Regenerate `@parkcore/api-client` through `pnpm contract:generate`; never edit `packages/api-client/src/generated/schema.ts` manually.
- Root installation must not require API runtime environment variables. Prisma generation is explicit in API build and database setup workflows.
- Preserve unrelated changes. Do not commit, push, deploy, or modify remote databases unless explicitly requested.

## Verification

Use the relevant workspace check while changing it. Before handoff for cross-workspace work, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm contract:check
pnpm build
```

Read the nearest `AGENTS.md` before changing an application.
