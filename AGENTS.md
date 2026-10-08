# ParkCore - Agent Instructions

## Project

ParkCore is a TypeScript monorepo for a bilingual parking operations product. The current runtime includes a React/Vite web client, an Express API backed by PostgreSQL and Prisma, and a generated OpenAPI client.

## Instruction hierarchy

Use this order when instructions overlap:

1. explicit user request;
2. the nearest applicable `AGENTS.md`;
3. the invoked repository skill under `.agents/skills/`;
4. approved ParkCore decision documents;
5. current source, tests, manifests, runtime configuration, and CI as evidence of what exists now.

Use the smallest authoritative context required for the task. Do not create a competing source of truth.

## Authority and truth boundaries

- `local-docs/` is git-ignored and never linked from tracked files: active plans in `execution/`, issue drafts in `issues/`, human-kept material in `keep/`, and every other agent-written file (scripts, PR text, screenshots, build output) in `tmp/`. Deleting `tmp/` contents, plans whose PRs merged, and posted issue drafts needs no confirmation; never delete `keep/`.
- The roadmap at `local-docs/keep/DEVELOPMENT-ROADMAP.md` owns sequencing and scope.
- Public `docs/` describes current runtime truth.
- Future approved design/UI decisions belong in `local-docs/keep/`.
- Active implementation plans belong in `local-docs/execution/`.

Never publish local planning material or document target behavior as shipped behavior before the code makes it true. Local screenshots, audits, prompts, and review evidence remain in `local-docs/tmp/`.

## Language boundary

Engineering artifacts are written in English, including code identifiers, comments, documentation, tests, metadata, branch names, commits, pull requests, and squash messages.

ParkCore product copy is bilingual:

- Spanish is authored first with primary locale `es-AR`.
- `es-AR` controls regional formatting and localization behavior, not writing voice.
- Spanish uses a neutral, natural product register. Do not infer voseo from `es-AR`; avoid regional slang and deliberately Rioplatense phrasing.
 - English uses secondary locale `en-US` with a natural, concise product register and is adapted from intent.
- Preserve key parity, domain terminology, accessibility, and Spanish-first authoring.

No ParkCore-authored text uses the em dash character. Generated dependencies, lockfiles, build output, generated clients, coverage, and vendor content are not authored text.

## Planning and delivery boundary

Use repository skills for repeated procedures:

- `$plan-implementation` creates decision-complete plans from roadmap or product intent.
- `$implement-task` implements one approved task packet and its verification.
- `$git-delivery` owns branch, commit, pull request, and squash naming and wording when those actions are explicitly requested.

A roadmap phase is normally implemented on one outcome branch. Tasks are cohesive commits on that branch. Do not create a new branch merely because execution moves to another task. Do not create branches, commits, pull requests, tags, or merges unless the user explicitly requests them.

Planning labels may locate work in local plans, but must not appear in repository delivery names or messages.

## Technology and architecture

- **Language and runtime:** TypeScript on Node.js 24
- **Web:** React and Vite under `apps/web/`
- **API:** Express under `apps/api/`
- **Persistence:** PostgreSQL through Prisma
- **Contract:** generated OpenAPI client under `packages/api-client/`
- **Tooling:** pnpm workspaces, Vitest, Testing Library, and Playwright

Key boundaries:

```text
apps/web       bilingual user interface, routes, components, locale catalogs
apps/api       server rules, persistence, auth, domain features, OpenAPI
packages/*     shared generated or reusable workspace packages
scripts/       repository verification and authored-text checks
docs/          public current-state technical documentation
local-docs/    ignored roadmap and approved design/UI decisions, active plans, issue drafts, and temporary material
.agents/skills/ tracked reusable engineering procedures
```

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Dev | `pnpm dev` |
| Format check | `pnpm format:check` |
| Lint | `pnpm lint` |
| Type check | `pnpm typecheck` |
| Test | `pnpm test` |
| Verify | `pnpm preflight` |
| Web E2E | `pnpm --filter @parkcore/web test:e2e` |
| Web hardening E2E | `pnpm --filter @parkcore/web test:e2e:hardening` |
| Build | `pnpm build` |
| Localization parity | `pnpm locales:check` |
| Authored-text check | `pnpm text:check` |
| Contract check | `pnpm contract:check` |

## Backend and domain rules

Server rules are authoritative for ownership, public eligibility, capacity, schedule and open state, session lifecycle, pricing, currency, demo isolation, and time boundaries. Do not weaken a server invariant because the client already prevents the action. Use real PostgreSQL behavior for tests involving persistence, transactions, constraints, or concurrency.

## UI and design rules

Use semantic tokens and the approved project design. Do not invent a visual system in route code or substitute a generic SaaS composition. Every P0 and P1 route preserves Spanish and English parity, light and dark parity, system theme behavior where applicable, responsive authored layouts, keyboard and accessibility requirements, and reachable loading, empty, error, success, blocked, and degraded states. Never replace API failures with fixtures.

## Testing rules

Test the smallest correct boundary: unit, then integration, then E2E when needed. Add or update tests for changed behavior. Match the repository CI contract, treat flaky tests as defects, and never claim a command passed unless it actually ran successfully.

## Documentation rules

Update public documentation only when implementation makes a new current-state fact true. Keep target decisions in their existing local authorities. Keep local planning and execution material out of public documentation. Do not add a replacement workflow document when a repository skill already owns the procedure.

## Delivery

Keep delivery text outcome-oriented and in English. Follow `$git-delivery` for exact naming and output rules. Review the task diff and verification before creating an explicitly requested commit, and keep unrelated work out of the commit.
