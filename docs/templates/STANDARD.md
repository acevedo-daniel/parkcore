<!--
DEV DOCS STANDARD V3 — TEMPLATE CONTROLLER
This file is NOT materialized into an active project document.
It defines how every template in this directory is selected, created, updated, linked, and removed.

When the user asks to apply, update, migrate, normalize, or audit project documentation:
1. Read this file first.
2. Inspect the repository before writing documentation.
3. Read only the templates whose activation conditions are met or whose target documents already exist.
4. Update existing targets in place. Do not create duplicates such as README-new.md or AGENTS-new.md.
5. Never use template placeholders as project facts.
-->
# Documentation Standard

> Rules for creating and maintaining only the documentation a modern solo or small-team software project actually needs.

## 1. Goal

Documentation must reduce ambiguity, preserve durable decisions, make the repository reproducible, and constrain coding agents where the code alone is insufficient.

Do not create documentation for completeness, ceremony, or future possibilities.

## 2. Core rules

- Inspect before documenting.
- Prefer verified repository facts over assumptions.
- Preserve correct existing content.
- Remove stale, duplicated, speculative, or placeholder content when updating a document.
- Do not invent commands, versions, URLs, features, architecture, policies, credentials, SLAs, licenses, or deployment details.
- If a non-critical fact cannot be verified, omit it.
- If an important decision is unresolved, record it as unresolved instead of deciding silently.
- One concept should have one primary source of truth.
- Templates define structure and update behavior; they are never a source of project facts.
- Do not create empty documents.
- Do not create a document merely because a template exists.

## 3. Materialization matrix

| Template | Active target | Activation |
|---|---|---|
| `README.md` | `/README.md` | Always for a software repository. |
| `PROJECT.md` | `/docs/PROJECT.md` | Create when product scope, users, workflows, constraints, locked decisions, or open decisions need durable project-level definition. Keep/update if it already exists and has useful content. |
| `ARCHITECTURE.md` | `/docs/ARCHITECTURE.md` | Create when the system has meaningful component boundaries, dependency rules, persistent data, external systems, runtime topology, or architectural invariants. |
| `DEVELOPMENT.md` | `/docs/DEVELOPMENT.md` | Create when local setup, environment, workspace commands, database workflow, or development conventions are too detailed for README quick start. |
| `TESTING.md` | `/docs/TESTING.md` | Create when testing has multiple layers, special setup/data, critical-path expectations, or quality gates that are not obvious from scripts. |
| `PLAN.md` | `/docs/plans/<NNN>-<slug>.md` | Create for a specific non-trivial implementation effort that benefits from explicit scope, steps, acceptance criteria, and verification. |
| `ADR.md` | `/docs/adr/<NNN>-<slug>.md` | Create only for a significant durable technical decision with meaningful alternatives or future reversal cost. |
| `DEPLOYMENT.md` | `/docs/DEPLOYMENT.md` | Create only when deployment has non-trivial environments, CI/CD flow, migrations, validation, release sequencing, or rollback/recovery behavior. |
| `OPERATIONS.md` | `/docs/OPERATIONS.md` | Create only for a live system that needs recurring operational knowledge: observability, incidents, backups, jobs, queues, recovery, or maintenance. |
| `SECURITY.md` | `/SECURITY.md` or `/docs/SECURITY.md` | Create only when a real security policy, reporting channel, supported versions policy, threat-specific guidance, or project-specific security procedures exist. |

## 4. Update modes

Every active target uses **create-or-update**, never blind replacement.

### If the target does not exist

Create it only when its activation condition is met.

### If the target already exists

- Keep verified, useful, project-specific information.
- Reorganize content into the current template structure when that improves clarity.
- Replace stale statements with verified current facts.
- Remove duplicated sections whose source of truth lives elsewhere.
- Remove empty headings, template comments, and unresolved placeholders.
- Preserve useful custom sections that do not conflict with this standard.
- Do not reset a mature document merely to make it visually identical to the template.

### If the document no longer appears necessary

Do not delete it during an unrelated task.

During an explicit documentation migration/cleanup:
1. move any unique durable information to the correct active document;
2. verify nothing useful would be lost;
3. remove the redundant document only when its responsibility is fully absorbed or obsolete.

## 5. Repository inspection order

Inspect only what is necessary, typically:

1. existing `README.md` and relevant `docs/` files;
2. package/project manifests and lockfiles;
3. scripts and task runners;
4. framework/tool configuration;
5. environment examples;
6. repository structure;
7. relevant source code and tests;
8. CI/CD configuration;
9. infrastructure/deployment configuration when applicable.

Do not infer project behavior from filenames alone when the implementation can be checked directly.

## 6. Source-of-truth map

Use responsibility-specific truth instead of one universal precedence list.

| Question | Primary truth |
|---|---|
| What does the software currently do? | Code, tests, runtime/config contracts. |
| What is the project trying to be? | `docs/PROJECT.md` when present. |
| What scope or major decisions are locked? | `docs/PROJECT.md`, accepted ADRs, explicit current user instruction. |
| How must modules depend on each other? | `docs/ARCHITECTURE.md`, accepted ADRs, enforced tooling/tests. |
| Which commands and versions are real? | Manifests, lockfiles, scripts, tool configs, CI. |
| How is correctness verified? | Tests/configuration first, then `docs/TESTING.md`. |
| How is a specific approved change implemented? | Current task + active plan. |
| How are docs shaped? | `docs/templates/*`; templates never supply project facts. |

If two authoritative sources materially conflict, identify the conflict instead of silently selecting whichever is convenient.

## 7. Document responsibility graph

```text
README
  onboarding + quick start
       |
       +--> PROJECT       what / why / scope / durable direction
       +--> ARCHITECTURE  system boundaries / dependency rules
       +--> DEVELOPMENT   local workflow / environment / commands
       +--> TESTING       verification strategy

PROJECT <--> ARCHITECTURE
   |              |
   |              +--> ADRs
   +--> Plans <---+

DEVELOPMENT <--> TESTING

DEPLOYMENT / OPERATIONS / SECURITY
  exist only when the repository has real knowledge that needs them
```

Documents should link to related active documents rather than duplicate their content.

## 8. Decision states

Use these states when a durable decision is not simply binary:

- **locked** — implementation must respect it; changing it requires explicit reconsideration.
- **proposed** — a candidate direction exists but is not approved as durable project truth.
- **unresolved** — intentionally undecided; do not choose implicitly while implementing another task.

Do not turn `proposed` or `unresolved` into `locked` as a side effect of unrelated implementation.

## 9. Plans vs durable documentation

Use durable docs for stable project knowledge.

Use a plan for the execution of one substantial change.

A plan may contain temporary implementation detail that does not belong in `PROJECT.md` or `ARCHITECTURE.md` after the work is finished.

Create a plan for work such as:

- a new feature spanning several areas;
- authentication or authorization changes;
- schema or migration work;
- major frontend sections;
- architectural refactors;
- repository/monorepo restructuring;
- new external integrations;
- complex bug fixes with uncertain root cause.

Do not create a plan for trivial edits, small localized fixes, or routine dependency bumps unless complexity/risk justifies one.

## 10. ADR threshold

Create an ADR only when the decision is durable and expensive enough to revisit that future maintainers benefit from knowing why it was made.

Typical ADR topics:

- database/ORM strategy;
- authentication architecture;
- monorepo/package boundary strategy;
- important infrastructure choice;
- event/queue architecture;
- major framework/pattern adoption or replacement.

Do not create ADRs for ordinary implementation details, naming, minor libraries, formatting, or local refactors.

## 11. Adaptive sections

Templates contain optional sections for common system shapes. Keep only what applies.

Examples:

- web application → rendering, routing, state ownership, data fetching, UI boundaries;
- API/service → request lifecycle, validation, persistence, contracts, background work;
- monorepo → workspace layout, package responsibilities, import/dependency rules;
- library/CLI → public API/command surface, compatibility, packaging, release concerns.

Do not create separate profile documents. Adapt the relevant sections inside the shared templates.

## 12. Deprecated default documents

These are not part of the default V3 standard:

- `SPECIFICATION.md`
- `CONTRIBUTING.md`
- `ROADMAP.md`
- `TODO.md`
- mandatory `CHANGELOG.md`

During migration:

- move durable product requirements/business rules from `SPECIFICATION.md` into `PROJECT.md` when they define the product globally;
- move feature-specific acceptance criteria into the relevant plan/tests;
- move internal contribution workflow into `DEVELOPMENT.md` if still useful;
- keep public contribution/security/release documents only when the project truly needs them;
- use an issue tracker for ongoing backlog rather than duplicating it in Markdown.

## 13. Documentation impact map

When implementation changes project truth, update only affected documents.

```text
project purpose/scope/workflows     -> PROJECT
locked/open project decision        -> PROJECT and maybe ADR
system/component/dependency rule    -> ARCHITECTURE and maybe ADR
setup/env/commands/dev workflow     -> DEVELOPMENT and maybe README
verification/test strategy          -> TESTING
release/deploy/rollback procedure   -> DEPLOYMENT
operations/recovery/observability   -> OPERATIONS
security policy/reporting           -> SECURITY
quick-start/onboarding              -> README
specific implementation execution  -> current plan
no durable documentation impact     -> no docs update
```

## 14. Completion rules for documentation work

Documentation work is complete only when:

- every created document satisfies its activation condition;
- existing active documents were updated rather than duplicated;
- no template placeholders remain in active docs;
- no empty or speculative sections remain;
- commands and versions are verified;
- links point only to files that actually exist;
- facts do not contradict the current repository without explicitly documenting the discrepancy;
- duplicated responsibilities have been removed or consolidated;
- active docs form a coherent navigation path from `README.md`.
