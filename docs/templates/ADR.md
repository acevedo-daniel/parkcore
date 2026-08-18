<!--
TEMPLATE CONTRACT
Target: /docs/adr/<NNN>-<slug>.md
Activation: Significant durable technical decision with real alternatives and meaningful future reversal or maintenance cost.
Mode: Create new ADR per decision; do not rewrite historical reasoning of accepted decisions. Supersede with a new ADR when necessary.
Primary responsibility: Preserve the rationale, evaluated alternatives, and trade-offs of a major technical choice.
Primary sources: Technical discussions, architectural constraints, prototype evidence, benchmark results.

Update rules:
- Do not create ADRs for routine implementation details, minor libraries, or naming conventions.
- Remove this comment block and placeholders in the active file.
-->

# ADR-{{NNN}}: {{DECISION_TITLE}}

- **Status:** {{proposed | accepted | rejected | superseded}}
- **Date:** {{YYYY-MM-DD}}
- **Supersedes:** {{PREVIOUS_ADR_OR_NONE}}
- **Superseded by:** {{LATER_ADR_OR_NONE}}

## Context

{{EXPLANATION_OF_THE_TECHNICAL_OR_ARCHITECTURAL_PROBLEM_AND_CONSTRAINTS}}

## Decision drivers

- {{DRIVER_1_EG_CONCURRENCY_SAFETY}}
- {{DRIVER_2_EG_CONTRACT_TYPE_SAFETY}}
- {{DRIVER_3_EG_MAINTENANCE_OVERHEAD}}

## Options considered

### Option 1: {{OPTION_1_TITLE}}

**Advantages**

- {{ADVANTAGE_1}}
- {{ADVANTAGE_2}}

**Costs / risks**

- {{COST_OR_RISK_1}}
- {{COST_OR_RISK_2}}

### Option 2: {{OPTION_2_TITLE}}

**Advantages**

- {{ADVANTAGE_1}}
- {{ADVANTAGE_2}}

**Costs / risks**

- {{COST_OR_RISK_1}}
- {{COST_OR_RISK_2}}

## Decision

{{EXPLICIT_DECISION_AND_RATIONALE_FOR_WHY_THE_CHOSEN_OPTION_WAS_SELECTED}}

## Consequences

### Positive

- {{POSITIVE_CONSEQUENCE_1}}
- {{POSITIVE_CONSEQUENCE_2}}

### Trade-offs

- {{ACCEPTED_TRADEOFF_1}}
- {{ACCEPTED_TRADEOFF_2}}

## Revisit triggers

- {{EXPLICIT_FUTURE_CONDITION_THAT_WOULD_JUSTIFY_REVISITING_THIS_DECISION}}

## References

- {{LINK_TO_RELEVANT_ISSUE_PLAN_OR_EXTERNAL_BENCHMARK}}
