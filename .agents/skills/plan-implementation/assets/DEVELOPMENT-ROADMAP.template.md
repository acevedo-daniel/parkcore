---
mode: decision
status: template
---

<!--
TEMPLATE — DEVELOPMENT-ROADMAP.md
Place: /docs/DEVELOPMENT-ROADMAP.md
When: the project needs phase sequencing, scope boundaries, and exit criteria.
Rules:
- Derive the number, names, and order of phases from the current and target state; never force a generic lifecycle.
- Give every phase observable deliverables and testable exit criteria.
- The Current phase line is the only phase status, and it matches one `Phase:` heading exactly.
- A plan cites its phase as `docs/DEVELOPMENT-ROADMAP.md › Phase: <name>`.
- Phase names and numbers are planning metadata (see the git-delivery skill).
- Plan a phase with the plan-implementation skill; the plan cites this roadmap, never the reverse.
- When materializing, set `status: active` and remove this comment.
-->

# <FILL: Project Name> — Development roadmap

> Phase sequencing, scope boundaries, and exit criteria.

## Objective

<FILL: 1-2 sentences: the goal, the problem it solves, and the nature of the initiative, e.g. greenfield build, redesign, refactor, hardening, migration>

**Current phase:** <FILL: phase name, matching its Phase: heading exactly>

<!-- <OPTIONAL: include when decisions bind every phase and no PROJECT.md or ARCHITECTURE.md records them yet> -->
## Constraints

- <FILL: fixed decision every phase must respect, e.g. stack, hosting, budget, deadline, or compliance>

## Phases

| Phase | Outcome | Depends on |
| --- | --- | --- |
| <FILL: phase name> | <FILL: milestone outcome> | <FILL: none or phase name> |

## Phase: <FILL: phase name>

### Objective

<FILL: capability or verified state that exists when this phase is done>

### In scope

- <FILL: concrete deliverable: code, module, migration, view, or behavior>

### Out of scope

- <FILL: work intentionally deferred to a later phase>

### Exit criteria

- <FILL: automated check that must pass>
- <FILL: observable runtime behavior>
- <FILL: documentation or configuration that reflects the new state, including README capabilities and screenshots for user-facing changes>

<!-- Repeat the phase section for each row in the Phases table. -->

## Maintenance

When a phase completes, move **Current phase** to the next phase and delete the completed phase's section and table row; Git history keeps them.
