<!--
TEMPLATE CONTRACT
Target: /docs/adr/<NNN>-<slug>.md
Activation: significant durable technical decision with real alternatives and meaningful future reversal/maintenance cost.
Mode: create new ADR per decision; do not rewrite accepted historical reasoning to pretend a later decision was always true. Supersede with a new ADR when needed.
Primary responsibility: preserve why a consequential technical choice was made.
Primary sources: actual decision discussion, project constraints, architecture, experiments/evidence.

Do not create ADRs for trivial implementation details or ordinary package choices.
Remove this comment and placeholders in the active file.
-->
# ADR-{{NNN}}: {{DECISION_TITLE}}

- **Status:** {{proposed | accepted | rejected | superseded}}
- **Date:** {{YYYY-MM-DD}}
- **Supersedes:** {{ADR_OR_NONE}}
- **Superseded by:** {{ADR_OR_NONE}}

## Context

{{WHY_THIS_DECISION_IS_NEEDED}}

## Decision drivers

- {{DRIVER}}

## Options considered

### {{OPTION_A}}

**Advantages**

- {{ADVANTAGE}}

**Costs / risks**

- {{COST_OR_RISK}}

### {{OPTION_B}}

**Advantages**

- {{ADVANTAGE}}

**Costs / risks**

- {{COST_OR_RISK}}

## Decision

{{CHOSEN_OPTION_AND_REASON}}

## Consequences

### Positive

- {{POSITIVE_CONSEQUENCE}}

### Trade-offs

- {{TRADEOFF}}

## Revisit when

- {{CONDITION_THAT_WOULD_JUSTIFY_RECONSIDERATION}}

## References

- {{ISSUE_PLAN_PR_BENCHMARK_OR_RELATED_ADR_OR_REMOVE}}
