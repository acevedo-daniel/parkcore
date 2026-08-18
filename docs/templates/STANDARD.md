<!--
DEV DOCS STANDARD V4 — REUSABLE PROJECT DOCUMENTATION STANDARD
Reference Implementation: ParkCore
This file is NOT materialized into an active project document.
It defines how every template in this directory is selected, created, updated, linked, and adapted across projects and tech stacks.

When an AI agent or developer is tasked to create, update, migrate, normalize, or audit project documentation:
1. Inspect the real project first.
2. Treat implementation as the single source of truth.
3. Preserve valid existing documentation.
4. Update rather than blindly regenerate.
5. Create only documents the project genuinely needs.
6. Avoid duplicated responsibilities.
7. Remove obsolete claims.
8. Avoid documenting speculative features.
9. Maintain consistent design and hierarchy across projects.
-->

# Project Documentation Standard

> Adaptive standard for creating, maintaining, and evolving professional software project documentation.

## 1. Goal

Project documentation must:

- communicate the product identity and engineering quality clearly and concisely;
- reduce ambiguity and preserve durable domain/technical decisions;
- make the repository reproducible from scratch;
- constrain developers and coding agents where code alone is insufficient.

Documentation must **never** be generated for ceremony, vanity metrics, badge walls, or speculative future possibilities.

---

## 2. Core Principles

1. **Inspect before documenting:** Examine manifests, lockfiles, scripts, source files, tests, environment configurations, and CI pipelines before writing or updating documentation.
2. **Implementation is ground truth:** If existing documentation contradicts running code, tests, or manifests, investigate the discrepancy and align documentation with reality.
3. **Preserve verified knowledge:** When updating documentation, preserve accurate project-specific context, verified nuances, and established domain decisions.
4. **Update in place; never duplicate:** Update existing documents directly. Never create duplicate artifacts (e.g. `README-new.md`, `ARCHITECTURE-v2.md`, or temporary agent notes) in the public tree.
5. **No speculative features:** Document only what is implemented, verified, or explicitly locked for the current milestone. Never document hypothetical backlogs as existing capabilities.
6. **No marketing fluff or badge walls:** Use concise, factual technical prose. Avoid promotional hype, inflated claims, and decorative badge walls.
7. **Single responsibility per document:** Each document has one primary information concern. Cross-reference related files via relative links instead of repeating content.
8. **No broken links or obsolete URLs:** Every markdown link must point to an active, existing file or a verified live deployment endpoint.

---

## 3. The Adaptive Rule

> **"Create only documentation that has a clear and distinct information responsibility in the current project. If the information fits cleanly into an existing document, do not create another file."**

Projects vary from single-file microservices, full-stack monorepos, and CLI tools, to multi-tier web applications using diverse stacks (Django, NestJS, Spring Boot, Express, FastAPI, Go, etc.). The documentation set must adapt proportionally to the project's real complexity.

---

## 4. Document Categories

### A. Baseline Documents

Every non-trivial software application or service repository should maintain these core documents:

| Document          | Target Location         | Primary Responsibility                                                                                                                                                                                          |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`       | `/README.md`            | **Entry point.** Product identity, live proof/demo, screenshots, key capabilities, strongest engineering signals, quick local setup, executable quality commands, and doc navigation.                           |
| `PROJECT.md`      | `/docs/PROJECT.md`      | **Product & domain source of truth.** Problem statement, target users/actors, core workflows, explicit in-scope and out-of-scope non-goals, durable business rules, and locked/open decisions.                  |
| `ARCHITECTURE.md` | `/docs/ARCHITECTURE.md` | **Technical & system source of truth.** Component boundaries, data flow, dependency rules (allowed & forbidden), data ownership, invariants, cross-cutting concerns, and stack-specific architectural patterns. |
| `DEVELOPMENT.md`  | `/docs/DEVELOPMENT.md`  | **Developer workflow.** Prerequisites, environment configuration boundaries (`.env` vs production), local execution, database lifecycle (migrations, seeds), script references, and dependency policies.        |

_(Note: For minimal scripts or single-purpose libraries, `PROJECT.md`, `ARCHITECTURE.md`, and `DEVELOPMENT.md` may be consolidated into `README.md` if the entire project fits cleanly in one document)._

### B. Conditional Documents

Create conditional documents **only** when a distinct, non-trivial requirement exists:

| Document        | Target Location                       | Activation Condition                                                                                                                                                                         |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TESTING.md`    | `/docs/TESTING.md`                    | Create when testing involves multiple distinct layers (unit, integration, E2E, contract), specialized test databases/containers, coverage enforcement, or critical validation gates.         |
| `DEPLOYMENT.md` | `/docs/DEPLOYMENT.md`                 | Create when the project has real deployment targets, production configuration/secrets management, cloud blueprints, forward database migrations, release sequencing, or smoke checks.        |
| `OPERATIONS.md` | `/docs/OPERATIONS.md`                 | Create only for live production systems requiring operational runbooks: service health signals, log inspection, scheduled jobs/queues, recurring maintenance, and backup/restore procedures. |
| `SECURITY.md`   | `/SECURITY.md` or `/docs/SECURITY.md` | Create only when a formal vulnerability reporting policy, supported versions matrix, or project-specific security compliance procedure is established.                                       |
| `PLAN.md`       | `/docs/plans/<NNN>-<slug>.md`         | Create as a temporary execution artifact for a complex, multi-step implementation effort requiring scoped steps, task-level acceptance criteria, and verification checkpoints.               |
| `ADR.md`        | `/docs/adr/<NNN>-<slug>.md`           | Create only for significant, durable architectural decisions with meaningful alternatives and high reversal/maintenance costs.                                                               |

### C. Project-Specific Custom Documents

Create specialized documents (e.g. `docs/WEB-DESIGN.md`, `docs/API.md`, `docs/ALGORITHMS.md`) **only** when a deep, specialized information concern exists that would bloat the baseline documents. Do not create them by default.

---

## 5. Document Responsibility & Navigation Graph

```text
                           README.md
         (Product identity, proof, engineering highlights,
             quick start, quality commands, doc index)
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
 docs/PROJECT.md       docs/ARCHITECTURE.md    docs/DEVELOPMENT.md
 (Product / domain      (System structure,      (Local workflow, env,
  rules & decisions)     boundaries, invariants) database, commands)
       |                       |                       |
       |                       +--------+              |
       |                                |              v
       v                                v        docs/TESTING.md
  docs/plans/                       docs/adr/     (Test strategy &
 (Active plans)                     (Decisions)    quality gates)
                                        |
                                        v
                                docs/DEPLOYMENT.md
                                (Hosted topology,
                                 release & migrations)
                                        |
                                        v
                                docs/OPERATIONS.md
                                (Health, runbooks,
                                 backups & recovery)
```

---

## 6. Portfolio README Design Standard

A portfolio repository README must showcase strong engineering judgment and clear communication. It should adhere to the following visual and information hierarchy:

1. **Title & Tagline:** `# ProjectName` followed by a concise blockquote description (`> One-line purpose`).
2. **Overview Paragraph:** 2–3 sentences defining what problem it solves, who it is for, and key domain boundaries (including what it intentionally is _not_).
3. **Demo / Live Proof (Conditional):** Direct links to production web app, API health endpoint (`/healthz`), staging demo, or package registry.
4. **Screenshots (Conditional):** High-contrast, clean screenshots of key operational screens or user flows (use 2-column Markdown tables for paired workflows like check-in / checkout).
5. **Key Capabilities:** 4–6 bullet points detailing domain-specific, implemented capabilities.
6. **Engineering Highlights:** 4–6 bullet points highlighting architectural discipline (e.g. API invariant enforcement, concurrency controls, immutability, contract-driven clients, multi-layer verification).
7. **Architecture:** High-level topology diagram (`mermaid` or `text`) and a short explanation of system boundaries and contract flow.
8. **Technology Stack:** Disciplined categorization (e.g., Web, API, Database, Tooling / Backend, Frontend, Infrastructure).
9. **Repository Structure:** Clean Markdown table mapping top-level directories to their distinct responsibilities.
10. **Local Development:** Prerequisites, minimal commands to copy environment examples, boot dependencies (e.g. Docker), run migrations/seeds, and start dev servers.
11. **Quality & Verification:** Executable quality commands (`lint`, `typecheck`, `test`, `coverage`, `e2e`, `contract:check`, `build`) and CI pipeline explanation.
12. **Documentation Index:** Uncluttered list linking to active docs with a concise one-line summary for each link.

_(Note: Every section is optional when inapplicable. For example, a headless backend or CLI tool omits Screenshots and Web Stack; a serverless function repository omits database container setup)._

---

## 7. Multi-Stack Adaptation Rules

When applying this standard to different technologies, adapt the terminology and tools while preserving the information hierarchy:

| Stack                                   | Common Artifacts / Tools                                 | Architecture Focus                                                         | Development Focus                                                         | Testing Focus                                                      |
| --------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **TypeScript / Node / Express / React** | pnpm, Vite, Prisma, Vitest, Playwright                   | OpenAPI contracts, browser/API boundary, workspace isolation               | `.env.example`, Docker Compose, Prisma migrations                         | Component tests, API route tests, contract checks, Playwright E2E  |
| **Django / Python**                     | poetry/uv, Django ORM, Pytest, Celery                    | Apps boundaries, Django models/signals, middleware, REST/Ninja contracts   | `manage.py`, virtual environments, settings split (`base`, `dev`, `prod`) | Pytest, Django test runner, factory-boy, schema validation         |
| **NestJS / Node**                       | npm/pnpm, TypeORM/Prisma, Jest, Swagger                  | Modular architecture, DI tokens, guards/interceptors, DTO validation pipes | Environment config module, TypeORM migrations, Docker                     | Unit tests (`*.spec.ts`), E2E tests (`test/`), Swagger spec checks |
| **Spring Boot / Java / Kotlin**         | Gradle/Maven, Spring Data JPA, JUnit 5, Flyway/Liquibase | Controller-Service-Repository, domain entities, security filters           | `application.yml` profiles, Gradle wrapper, Testcontainers                | JUnit 5, MockMvc, Testcontainers integration tests, ArchUnit rules |
| **Go / Gin / Chi**                      | `go.mod`, `golangci-lint`, `sqlc` / GORM, `air`          | Package layout (cmd/internal/pkg), interface boundaries, concurrency       | `go run`, `Makefile`, SQL migrations (`golang-migrate`)                   | Standard `go test -race`, table-driven tests, integration tests    |

---

## 8. Rules for Updating Existing Projects

When updating documentation in an existing repository:

1. **Never delete without reading:** Review existing docs to extract unique historical context, domain decisions, and configuration nuances.
2. **Consolidate fragments:** Absorb small, disconnected markdown notes into the appropriate baseline document (`PROJECT.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`).
3. **Purge obsolete claims:** Remove references to deprecated endpoints, old repository names, removed features, and dead external URLs.
4. **Clean repository root:** Move deep architectural, operational, or design notes out of the root directory into `docs/`.
5. **Verify runnable commands:** Test all setup, test, lint, and build commands directly against the project before documenting them.

---

## 9. AI Agent Guardrails (Preventing Bloat & Hallucination)

AI coding agents generating or updating documentation **must adhere to these constraints**:

- ❌ **Do NOT invent features:** Never list planned, hypothetical, or unfinished features as existing capabilities.
- ❌ **Do NOT invent speculative architecture:** Document the system as it is currently built and configured, not an idealized enterprise pattern.
- ❌ **Do NOT generate empty or stub sections:** If an optional section does not apply, omit it entirely rather than leaving placeholders or "TBD".
- ❌ **Do NOT create badge walls:** Avoid endless build/status/license badges unless a verified CI badge URL is provided.
- ❌ **Do NOT write marketing fluff:** Replace vague claims ("blazing fast", "world class", "next-gen") with precise technical descriptions.
- ❌ **Do NOT duplicate documentation across files:** Keep one canonical source of truth for each concept and link to it.
- ❌ **Do NOT contradict code:** If the code uses integer cents for currency, docs must not describe floating-point dollars; if an API uses JWT in `localStorage`, docs must not describe session cookies.
