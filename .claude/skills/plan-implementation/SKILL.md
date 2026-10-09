---
name: plan-implementation
description: Use when the user asks to plan the implementation of a roadmap item, phase, milestone, feature, refactor, redesign, migration, or other multi-step engineering outcome. Inspect current repository reality and relevant decision documents, then produce a decision-complete implementation plan without leaking planning labels into delivery artifacts.
---

# Plan Implementation

Use this skill to turn approved roadmap or product intent into an implementation-ready plan.

## Core contract

- Planning and implementation are separate steps.
- Inspect current repository reality before decomposing work.
- Treat the roadmap as target-state guidance, not evidence that code already exists.
- Read only the documents and code boundaries relevant to the requested outcome.
- Preserve approved product, architecture, design, and testing decisions.
- Do not invent business rules, APIs, data models, or runtime capabilities.
- Do not create branches, commits, PRs, or merge text unless the user explicitly asks. When delivery artifacts are requested, use the `git-delivery` skill.
- Planning labels stay out of filenames and delivery artifacts (see the `git-delivery` skill).

## Read order

Always inspect:

1. root `AGENTS.md`;
2. the requested roadmap item or target statement;
3. current source, tests, manifests, and configuration for the affected boundaries.

Read when relevant:

- `PROJECT.md` for product boundaries;
- `ARCHITECTURE.md` for system boundaries and invariants;
- `design/PROJECT-DESIGN.md` and `design/UI-SPEC.md` for UI work;
- `TESTING.md` and CI for verification work;
- `DEVELOPMENT.md` for current development conventions;
- deployment or integration documentation when the outcome touches those boundaries.

Do not load broad research or unrelated docs when narrower approved specifications are available.

## Reconcile target with reality

Before planning tasks, determine:

- what already exists;
- what is missing;
- what must be changed rather than added;
- dependencies and ordering constraints;
- relevant tests and verification gates;
- documentation that must become true after implementation.

If current code contradicts an approved target, plan the transformation explicitly.

If authoritative documents conflict with each other in a way that changes product behavior or data safety, surface the conflict instead of silently choosing a new rule.

## Decide whether a written plan is useful

Create a written execution plan when the outcome crosses multiple boundaries, requires ordering, or is too large for one obvious delivery.

Typical reasons:

- multiple routes or workflows;
- schema or migrations;
- auth or authorization;
- external integrations;
- broad UI propagation;
- CI architecture;
- transactional behavior;
- several coherent deliveries.

For a small, obvious, low-risk outcome, a short in-chat plan is enough unless the user requested a file.

## Write the plan

Before saving, run `python ../apply-playbook/scripts/check_local_docs.py --fix <project-root>` from this skill's directory (`python3` where `python` is unavailable). Report deleted files and remaining findings in one line; do not resolve findings unasked.

Fill [`PLAN.template.md`](assets/PLAN.template.md) from this skill's assets directory and save it as:

```text
local-docs/execution/<outcome-slug>.md
```

`local-docs/` is the git-ignored working space defined in `AGENTS.md`.

The template owns the plan structure, the Progress table, and the execution protocol. Do not invent another format. Do not use filenames such as `PHASE-03.md` or task-number filenames unless the user explicitly requests that convention.

Write for a different executor: another agent, tool, or smaller model that has never seen this conversation. Follow the planner rules in the template's header comment; the plan is the executor's only context. Ask the user the Open questions before marking the plan `ready`.

A later prompt such as `Implement Task 2. Commit the changes.` must be enough to execute a task without re-planning. Task numbers are addresses only; never copy them into branches, commits, PRs, filenames, or identifiers.

## Task sizing

Each task should:

- have one dominant outcome;
- be independently understandable;
- have clear acceptance criteria;
- be independently verifiable;
- form a coherent implementation/delivery unit;
- avoid unrelated cleanup.

Do not split work merely by file count.

When `AGENTS.md` has a Delegation section, mark `Delegable: yes` on tasks a teammate can finish without the owner and that no other task depends on: manual checks of finished user-facing work, docs that became true, research or data gathering, and small bounded fixes. Delegable tasks are `mechanical` or `standard` Effort. When a task bundles such work with core work, split it out. When the plan changes user-facing behavior, end it with a delegable manual check task. Without a Delegation section, do not mark tasks.

Prefer outcome wording such as:

```text
Add tutor create and edit workflow
Enforce server-side role authorization
Build responsive hour movement dialog
Add deterministic real-stack browser proof
```

Avoid planning-container wording such as:

```text
Complete the next phase
Implement task 4
Finish the backend
Do the remaining UI
```

## Verification planning

For each task, state the smallest useful verification boundary first, then broader repository checks when appropriate.

Do not claim that checks passed during planning.

For meaningful UI work, plan a verification task that runs the build-ui visual review loop on the changed views.

## Documentation sync

Distinguish target-state docs from evidence/current-state docs.

Plan updates to current-state documentation only when implementation makes a new fact true.

Do not create a second specification when an existing approved document already owns the decision.

## Final check

Before finalizing the plan, verify:

- it follows `PLAN.template.md`, with every `<FILL:` resolved and inapplicable `<OPTIONAL:` blocks deleted;
- Open questions says `None` before Plan status is `ready`;
- it reflects current code reality;
- tasks are ordered by real dependencies;
- every task has a concrete outcome and acceptance criteria;
- every task is executable from a later queued prompt without re-planning;
- task boundaries map cleanly to cohesive commits and each task's Effort follows the template's classification test;
- no task depends on a `Delegable` task;
- no unrelated scope was added;
- planning identifiers did not leak into generated delivery names;
- the plan does not duplicate an existing source of truth.
