<!--
TEMPLATE CONTRACT
Target: /AGENTS.md
Activation: when coding agents are used in this repository.
Mode: create-or-update
Primary responsibility: compact, repository-specific execution contract for coding agents.
Primary sources: active project docs, repository boundaries, real scripts/configuration, explicit user rules.

Update rules:
- If AGENTS.md exists, update it in place; do not create AGENTS-new.md.
- Keep only durable instructions that should apply across many tasks.
- Do not turn this file into a complete architecture, style guide, or documentation manual.
- Reference active docs instead of duplicating them.
- Prefer enforceable repository-specific rules over generic advice.
- Remove this comment, placeholders, and empty optional sections in the active file.
-->
# AGENTS.md

## Project

{{ONE_PARAGRAPH_PROJECT_DESCRIPTION}}

{{CURRENT_HIGH_LEVEL_CONSTRAINT_OR_REMOVE}}

## Read before changing code

Use only the active documents relevant to the task:

- `docs/PROJECT.md` — product scope and durable project decisions, when present.
- `docs/ARCHITECTURE.md` — system boundaries and architectural invariants, when present.
- `docs/DEVELOPMENT.md` — local development workflow, when present.
- `docs/TESTING.md` — verification strategy, when present.
- `docs/adr/` — accepted technical decisions relevant to the area being changed.
- `docs/plans/` — use the current plan when the task explicitly references one.

When creating, migrating, or normalizing documentation, follow `docs/templates/STANDARD.md` and the relevant template files.

## Repository map

<!-- Only meaningful boundaries that prevent unnecessary exploration or wrong placement. -->

- `{{PATH}}` — {{RESPONSIBILITY}}
- `{{PATH}}` — {{RESPONSIBILITY}}

## Commands

<!-- Include only commands verified from repository scripts/configuration. Remove non-applicable rows. -->

| Task | Command |
|---|---|
| Install | `{{COMMAND}}` |
| Development | `{{COMMAND}}` |
| Test | `{{COMMAND}}` |
| Lint | `{{COMMAND}}` |
| Typecheck | `{{COMMAND}}` |
| Build | `{{COMMAND}}` |

## Engineering invariants

<!-- Keep repository-specific rules that code/tests/tooling do not already make obvious. -->

- Preserve existing behavior outside the requested scope.
- Follow established project boundaries before introducing new abstractions.
- Keep public contracts, types, validation, and persistence models intentionally separated when the architecture requires it.
- Do not weaken tests, validation, authorization, or security controls to make a change pass.
- Do not manually edit generated files unless the repository explicitly requires it.
- Keep unrelated user changes intact.

{{PROJECT_SPECIFIC_INVARIANTS_OR_REMOVE}}

## Decision boundaries

The agent may choose local implementation details that remain inside existing architecture and public behavior.

Do not make these changes implicitly as part of another task:

- replace a framework, database, ORM, authentication strategy, deployment architecture, or major architectural pattern;
- introduce a production dependency with material architectural/runtime impact;
- create a breaking public API or schema change;
- move responsibilities across established application/package/module boundaries;
- materially change product behavior or UX outside the requested scope.

When such a change appears necessary, identify it and explain the trade-off instead of silently treating it as an implementation detail.

{{PROJECT_SPECIFIC_DECISION_BOUNDARIES_OR_REMOVE}}

## Working protocol

1. Inspect the smallest relevant surface before editing.
2. Distinguish discussion/design/planning from implementation. Do not modify production code during a design-only or plan-only request.
3. For non-trivial work, use or create a plan only when the task benefits from explicit execution steps.
4. Implement the smallest coherent change that satisfies the requested scope.
5. Verify with the repository's real checks.
6. Review for regressions, unnecessary complexity, dead code, and boundary violations.
7. Update only documentation whose durable truth changed.

## Verification

Never claim a check passed unless it was executed.

If an applicable check cannot run, report:

- which check was not run;
- why;
- what alternative validation was performed, if any.

{{PROJECT_SPECIFIC_VERIFICATION_RULES_OR_REMOVE}}

## Definition of done

A task is complete when:

- the requested behavior or artifact is delivered;
- the change remains inside approved scope and architecture;
- relevant tests/checks pass or their limitations are explicitly reported;
- no unrelated changes were overwritten;
- affected active documentation reflects the new durable truth;
- no new placeholders, secrets, temporary hacks, or unverified claims were left behind.

## Repository actions

Do not commit, push, merge, publish, release, or deploy unless the user explicitly requests that action.
