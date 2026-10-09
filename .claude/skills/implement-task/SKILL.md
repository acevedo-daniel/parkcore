---
name: implement-task
description: Use when the user asks to implement a concrete engineering task, task packet, approved plan item, feature slice, fix, refactor, or UI delivery. Reconcile the requested outcome with current repository reality, implement only the agreed scope, verify the smallest correct boundaries, and synchronize documentation that became true. Also handles queued task execution when the user explicitly asks to commit each completed task or open a PR after the final task.
---

# Implement Task

Use this skill for decision-complete implementation work.

## Core contract

- Implement the requested durable outcome, not the planning label that contains it.
- Read root `AGENTS.md` first.
- Resolve overlapping instructions in this order: explicit user request, nearest applicable `AGENTS.md`, invoked skill, approved decision documents, then current source, tests, manifests, runtime configuration, and CI as evidence of what exists.
- Treat current source, tests, manifests, runtime configuration, and CI as evidence of what exists now.
- Treat approved decision documents as target-state authority for the requested scope.
- Reconcile the plan with repository reality before editing.
- Keep one dominant outcome and avoid opportunistic unrelated cleanup.
- Never invent product rules or silently change an approved invariant.
- Do not create repository delivery artifacts unless explicitly requested; use the `git-delivery` skill when they are requested.

## Plan addressing

The user may identify work with planning coordinates such as `Task 2`, `Phase: Billing - Task 2`, or a milestone label. These coordinates are valid for locating the requested plan item.

They are navigation metadata only:

1. resolve the referenced plan item;
2. extract its durable outcome, scope, acceptance criteria, dependencies, and verification;
3. implement that outcome;
4. keep the coordinates out of repository-facing artifacts (see the `git-delivery` skill).

## Queued execution contract

Support sequential prompts such as:

```text
Implement Task 1. Commit the changes.
Implement Task 2. Commit the changes.
Implement Task 3. Commit the changes and open a PR.
```

Treat each requested task as an atomic execution unit.

When the plan has an `Execution protocol` and a `Progress` table (plans written from the plan-implementation template), follow that protocol, honor its stop conditions over continuing, and update the task's Progress row after each task. The plan's Decisions are settled; do not reopen them. Skip rows marked `delegated`; their issue tracks them.

An issue written from the project's Task issue form is a complete task packet: implement it like a plan task and follow its Deliver field.

When the user asks to commit or open a PR, finish and verify the task first, then follow the git-delivery skill. Never commit a known-broken or incomplete task. A PR is derived from the full branch diff against the base branch.

## Load only useful context

Start with:

1. the user's requested outcome or implementation packet;
2. root `AGENTS.md`;
3. the referenced execution plan when one exists;
4. directly relevant code and tests.

Then read only the authoritative documents required by the affected boundary.

For UI work, follow the `build-ui` skill.

For testing or CI work, read the current test guide and workflow configuration.

For data, auth, integration, or deployment work, read the relevant architecture and operational contracts.

## Preflight

Before each queued task:

- inspect the current branch and working tree;
- confirm the task is not already completed and its predecessor tasks are present in the branch history or repository state;
- do not absorb unexplained or unresolved changes from a previous or failed task into the new task.

Before editing, verify:

- referenced paths and APIs still exist;
- assumptions in the plan remain true;
- the requested behavior is not already implemented;
- dependencies and generated artifacts are understood;
- the intended verification boundary exists.

If the plan is stale but the durable outcome is still clear, adapt the implementation to current repository reality without preserving obsolete file-level instructions.

If authoritative product rules conflict materially, surface the conflict rather than selecting a new business rule silently.

## Implementation rules

- Prefer a coherent vertical change over file-by-file work.
- Follow existing repository architecture unless the approved outcome requires changing it.
- Validate inputs at real boundaries.
- Preserve type safety and established error handling.
- Add dependencies only when the implementation genuinely needs them.
- Do not edit generated files manually; use the repository's generator when applicable.
- Keep user-facing copy in the product's intended language while keeping engineering artifacts in English.

## Fixes

A flaky or timing-out test is a bug: follow the `write-tests` skill's flake protocol.

For a bug fix:

1. Reproduce the bug with a test at the lowest boundary that shows it, and confirm the test fails for the reported reason.
2. Fix the cause, not the symptom.
3. Confirm the test passes and keep it.

If the bug cannot be reproduced, stop and report what you tried instead of guessing a fix.

## Verification

When adding, changing, or repairing tests, follow the `write-tests` skill.

Verify from narrow to broad:

1. focused tests for changed behavior;
2. relevant lint/type/contract checks;
3. broader repository gate when appropriate for the scope.

For visible UI changes, run the `build-ui` visual review loop.

Never claim a check passed unless it actually ran successfully.

When a check cannot run because of the environment, report the exact limitation and preserve the distinction between passed, failed, and not run.

Apply the repeated-failure rule in the project's `AGENTS.md`.

## Diff review

Before completion or commit, inspect the resulting change for:

- scope creep;
- duplicated abstractions;
- accidental generated or temporary files;
- stale comments or docs;
- secrets or personal data;
- unrelated formatting churn;
- inconsistent product copy or engineering language;
- planning metadata leaking into repository-facing artifacts.

## Documentation sync

Update current-state documentation only for facts that became true because of this implementation.

Do not rewrite target-state specifications merely to mirror implementation details.

Do not create a new document when an existing source of truth already owns the information.

When a change alters a view listed in UI-SPEC's README screenshot column, regenerate that screenshot with the Screenshots command in the same change.

Remove stale claims instead of layering contradictory notes.

Write scratch files (scripts, PR text, screenshots, build output) only to `local-docs/tmp/`, never to the `local-docs/` root or `execution/`. When a plan's final task is done, set its Plan status to `done`.

## Completion report

Return a concise completion report containing:

- what changed;
- verification actually performed and its status;
- commit created when explicitly requested;
- PR opened when explicitly requested;
- any genuine blocker or follow-up.

Do not add unrequested branch, PR, squash, or merge text.
