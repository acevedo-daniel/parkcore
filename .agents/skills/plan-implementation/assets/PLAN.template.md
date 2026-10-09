<!--
TEMPLATE — implementation plan
Place: local-docs/execution/<outcome-slug>.md (deleted by the local-docs check after its last PR merges)
Written by: any planner (chat session, coding agent, or the plan-implementation skill).
Read by: an executor agent that has never seen the planning conversation.

Rules for the planner:
- The plan is the executor's only context. Put everything needed to execute here, or link a tracked file.
- Decide; do not delegate decisions. Missing facts go to Open questions, and Plan status stays `draft`
  until that section says `None`.
- Verify every Current state fact against the Base commit and cite `path:line`.
- One task = one cohesive commit. Number tasks globally (Task 1..N); numbers are addresses, never names.
- Precompute branch, PR title, and commit subjects with the git-delivery rules; no planning labels.
- Effort routes each task to an executor tier and reasoning level. Ask: can Verification (checks
  or the user's explicit approval) reject a wrong result? If yes, the task is complex at most.
  mechanical = exact edits or exact text given; any model, low reasoning ·
  standard = local reasoning in a few files inside fixed decisions; medium reasoning ·
  complex = multi-file or cross-boundary work inside fixed decisions; strong model, medium reasoning ·
  judgment = success the checks cannot prove (visual quality, rule or spec wording, security
  design, conflicting sources); strongest model, high reasoning.
- Split a task when only part of it needs judgment.
- Give exact text whenever wording is itself a decision (rules, prompts, user-facing copy).
- Acceptance criteria measure the outcome. Use size proxies such as line or byte counts only when size is the outcome.
- A repository-wide check or rule lists what it excludes and which files must not change to satisfy it.
- A task that renames or deletes a section, heading, or file greps for its references in Verification.
- Delete <OPTIONAL: ...> blocks that do not apply and this comment.
-->

# <FILL: Outcome> implementation plan

- **Plan status:** <FILL: draft | ready | in progress | done>
- **Source:** <FILL: tracked roadmap phase (e.g. docs/DEVELOPMENT-ROADMAP.md › Phase: Billing), audit report, issue, or request>
- **Base:** <FILL: branch @ short SHA the plan was verified against>

## Outcome

<FILL: 1-3 sentences describing what is true when the plan is done>

## Current state

- <FILL: verified fact with evidence `path:line`>

## Scope

- **In:** <FILL: what this plan changes>
- **Out:** <FILL: explicit non-goals; the executor must not do these>

## Decisions

<!-- Settled by the planner. The executor applies them and does not revisit them. -->

- <FILL: decision — one-line reason>

## Open questions

<!-- Facts only the user can supply. Plan status cannot be `ready` until this says None. -->

- None

## Read first

<!-- The minimum context, in order. Load anything else only when a task names it. -->

1. `AGENTS.md`
2. <FILL: tracked spec, standard, or doc section the outcome depends on>

<!-- <OPTIONAL: include when the user must act before Task 1> -->
## Prerequisites

- <FILL: user action, with the exact paths to stage or the setting to change>

## Deliveries

| Delivery | Branch | PR title | Tasks |
| --- | --- | --- | --- |
| 1 | `<FILL: type/outcome-slug>` | `<FILL: type: outcome>` | <FILL: 1-N> |

## Progress

<!-- The executor edits only this table. Status: todo | done | blocked | delegated (Commit holds the issue `#N`). Verification: passed | failed | not run (reason). -->

| Task | Effort | Status | Commit | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | <FILL: effort> | todo | | | |

## Execution protocol

For each task, in order, skipping rows marked `delegated` (their issue tracks them):

1. **Preflight.** Confirm you are on the task's delivery branch with no uncommitted changes outside
   `local-docs/`, that every task in Depends on is `done`, and that the task's files and assumptions
   still match the repository.
2. **Implement** only the task's Changes. If a file outside its Files list must change, change it and
   say why in Notes.
3. **Verify** by running the task's Verification exactly as written.
4. **Commit** with the task's Commit subject when the user asked for commits. Adjust the subject only
   if the final diff differs.
5. **Record** the result in the task's Progress row.
6. **Close.** After the last task, set Plan status to `done`.

Open exactly one pull request per Deliveries row, using its branch and PR title.

Stop, mark the row `blocked`, explain in Notes, and report back when:

- an assumption, file, or acceptance criterion is wrong or ambiguous and fixing it needs a decision;
- the same verification fails after two fix attempts;
- the work would cross into Scope › Out or into a later task;
- two authoritative documents conflict.

A stop on a task below `judgment` is retried one Effort tier up, not again at the same tier.
A task executed below its Effort tier gets a review at its tier before its pull request merges.

Never weaken, skip, or delete a check to make it pass. Never mark a row `done` with failed verification.

## Tasks

### Task 1 - <FILL: concrete outcome in imperative form>

- **Depends on:** <FILL: none | Task N>
- **Effort:** <FILL: mechanical | standard | complex | judgment>
- **Delegable:** <OPTIONAL: yes, only when AGENTS.md has a Delegation section and no task depends on this one; delete this line otherwise>
- **Files:** <FILL: expected paths; not exhaustive>
- **Commit:** `<FILL: type: imperative subject>`

#### Changes

- <FILL: concrete change; quote exact text when the wording is a decision>

#### Acceptance criteria

- <FILL: observable condition>

#### Verification

```bash
<FILL: exact command>  # expect: <FILL: result>
```

<!-- <OPTIONAL: Documentation sync — only when the task makes a documented fact true> -->
#### Documentation sync

- <FILL: document and section to update>

## Completion criteria

- Plan status is exactly `done`.
- Every Progress row is `done` with verification `passed`, or `delegated`.
- <FILL: plan-level condition, e.g. the full local verify command or CI Gate passes on the final branch>
- <OPTIONAL: when the plan completes a roadmap phase, the final task updates that roadmap's current-phase line>
