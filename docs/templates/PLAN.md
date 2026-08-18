<!--
TEMPLATE CONTRACT
Target: /docs/plans/<NNN>-<slug>.md
Activation: A specific non-trivial implementation effort benefits from scoped execution steps, acceptance criteria, and verification checkpoints.
Mode: Create new plan for a distinct effort; update as work progresses; record completion notes when finished.
Primary responsibility: Bridge approved design/scope to step-by-step implementation and verification.
Primary sources: User request, active PROJECT/ARCHITECTURE docs, relevant code/tests, prior approved decisions.

Update rules:
- A plan is a temporary execution artifact, not a permanent specification.
- Keep task-specific detail here instead of bloating durable docs.
- Remove this comment block and placeholders in the active file.
-->

# {{PLAN_TITLE}}

- **Status:** {{proposed | approved | in-progress | completed | superseded}}
- **Scope:** {{ONE_LINE_SCOPE_SUMMARY}}

## Goal

{{EXACT_OUTCOME_TO_BE_ACHIEVED}}

## Context

{{BACKGROUND_WHY_THIS_CHANGE_IS_NEEDED_AND_CURRENT_STATE}}

## Sources of truth

- `{{PATH_OR_DOCUMENT_1}}` — {{WHY_IT_MATTERS}}
- `{{PATH_OR_DOCUMENT_2}}` — {{WHY_IT_MATTERS}}

## Decisions to preserve

- **{{LOCKED_DECISION_OR_INVARIANT_1}}**
- **{{LOCKED_DECISION_OR_INVARIANT_2}}**

## Scope

### Included

- {{INCLUDED_WORK_ITEM_1}}
- {{INCLUDED_WORK_ITEM_2}}

### Excluded

- {{EXPLICITLY_EXCLUDED_ITEM_1}}
- {{EXPLICITLY_EXCLUDED_ITEM_2}}

## Design and technical contract

{{DESIGN_SPECIFICATION_API_CONTRACT_OR_SCHEMA_CHANGES_NEEDED}}

## Implementation steps

### 1. {{STEP_1_TITLE}}

**Outcome:** {{STEP_1_EXPECTED_OUTCOME}}

- {{ACTION_1}}
- {{ACTION_2}}

**Affected areas:** `{{PATH_OR_MODULE_1}}`

### 2. {{STEP_2_TITLE}}

**Outcome:** {{STEP_2_EXPECTED_OUTCOME}}

- {{ACTION_1}}
- {{ACTION_2}}

**Affected areas:** `{{PATH_OR_MODULE_2}}`

## Acceptance criteria

- [ ] {{OBSERVABLE_ACCEPTANCE_CRITERION_1}}
- [ ] {{OBSERVABLE_ACCEPTANCE_CRITERION_2}}
- [ ] {{OBSERVABLE_ACCEPTANCE_CRITERION_3}}

## Verification plan

- [ ] `{{COMMAND_RUN_RELEVANT_TESTS}}`
- [ ] `{{COMMAND_LINT}}`
- [ ] `{{COMMAND_TYPECHECK}}`
- [ ] `{{COMMAND_BUILD}}`
- [ ] {{MANUAL_OR_SMOKE_VERIFICATION_CHECK}}

## Risks and edge cases

- **{{RISK_1}}:** {{MITIGATION_1}}
- **{{RISK_2}}:** {{MITIGATION_2}}

## Durable documentation impact

- **PROJECT.md:** {{CHANGES_OR_NONE}}
- **ARCHITECTURE.md:** {{CHANGES_OR_NONE}}
- **DEVELOPMENT.md:** {{CHANGES_OR_NONE}}

## Completion notes

{{FINAL_COMPLETION_NOTES_DEVIATIONS_AND_TEST_RESULTS_FILLED_UPON_COMPLETION}}
