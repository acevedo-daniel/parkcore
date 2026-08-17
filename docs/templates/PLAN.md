<!--
TEMPLATE CONTRACT
Target: /docs/plans/<NNN>-<slug>.md
Activation: one specific non-trivial change benefits from explicit execution planning.
Mode: create new plan for a distinct substantial effort; update the same plan while that effort evolves.
Primary responsibility: bridge approved design/scope to implementation and verification.
Primary sources: current user request, active PROJECT/ARCHITECTURE/ADRs, relevant code/tests, prior approved decisions.

A plan is not a permanent project specification. Keep task-specific detail here instead of bloating durable docs.
Do not mark a plan approved unless the user/project process actually approved it.
Remove this comment and placeholders in the active file.
-->
# {{PLAN_TITLE}}

- **Status:** {{proposed | approved | in-progress | completed | superseded}}
- **Scope:** {{ONE_LINE_SCOPE}}

## Goal

{{EXACT_OUTCOME}}

## Context

{{WHY_THIS_CHANGE_EXISTS_AND_CURRENT_STATE}}

## Sources of truth

<!-- Link only what is relevant and exists. -->

- `{{PATH_OR_DOCUMENT}}` — {{WHY_IT_MATTERS}}

## Decisions to preserve

<!-- Pull only relevant locked decisions/invariants; do not duplicate the whole PROJECT/ARCHITECTURE docs. -->

- {{LOCKED_DECISION_OR_INVARIANT}}

## Scope

### Included

- {{INCLUDED_WORK}}

### Excluded

- {{EXPLICITLY_EXCLUDED_WORK}}

## Design / behavior

<!-- Observable behavior, UX, API/data shape, or technical design needed before implementation. Omit subsections that do not apply. -->

{{APPROVED_DESIGN_OR_BEHAVIOR}}

## Implementation

### 1. {{STEP_TITLE}}

**Outcome:** {{STEP_OUTCOME}}

- {{ACTION}}
- {{ACTION}}

**Expected areas:** `{{PATH_OR_COMPONENT}}`

### 2. {{STEP_TITLE}}

**Outcome:** {{STEP_OUTCOME}}

- {{ACTION}}

## Data / migration impact

{{SCHEMA_DATA_MIGRATION_BACKFILL_COMPATIBILITY_OR_REMOVE}}

## API / contract impact

{{PUBLIC_API_EVENTS_TYPES_CONTRACTS_OR_REMOVE}}

## UI / state impact

{{ROUTES_COMPONENTS_STATES_RESPONSIVE_ACCESSIBILITY_OR_REMOVE}}

## Acceptance criteria

- [ ] {{OBSERVABLE_ACCEPTANCE_CRITERION}}
- [ ] {{OBSERVABLE_ACCEPTANCE_CRITERION}}

## Verification

- [ ] `{{TEST_COMMAND_OR_TARGETED_TEST}}`
- [ ] `{{LINT_COMMAND_OR_REMOVE}}`
- [ ] `{{TYPECHECK_COMMAND_OR_REMOVE}}`
- [ ] `{{BUILD_COMMAND_OR_REMOVE}}`
- [ ] {{MANUAL_SMOKE_OR_VISUAL_CHECK_OR_REMOVE}}

## Risks and edge cases

- {{RISK_OR_EDGE_CASE}}

## Documentation impact

<!-- List only docs whose durable truth is expected to change. Use "None" when appropriate. -->

- {{DOCUMENT_AND_REASON_OR_NONE}}

## Completion notes

<!-- Fill when completed; keep concise and factual. -->

{{FINAL_DEVIATIONS_VERIFICATION_LIMITATIONS_OR_REMOVE}}
