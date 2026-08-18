<!--
TEMPLATE CONTRACT
Target: /docs/PROJECT.md
Activation: Product/project-level scope, actors, core workflows, non-goals, durable domain rules, or locked decisions need a source of truth.
Mode: create-or-update
Primary responsibility: What the project is, why it exists, what belongs in it, and which domain rules implementation must respect.
Primary sources: Product requirements, domain model, current implementation, verified tests, accepted ADRs.

Update rules:
- Do not duplicate architecture internals, detailed setup, endpoint catalogs, or task-specific implementation plans here.
- Keep durable business rules here only when they define the product globally; feature-local acceptance criteria belong in plans/tests.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Project

## Product

{{WHAT_THE_SOFTWARE_IS_WHO_IT_IS_FOR_AND_CORE_VALUE_PROPOSITION}}

## Problem

{{CLEAR_DESCRIPTION_OF_THE_PROBLEM_BEING_SOLVED_AND_OPERATIONAL_PAIN_POINTS}}

## Actors

| Actor       | Capabilities                        |
| ----------- | ----------------------------------- |
| {{ACTOR_1}} | {{CAPABILITIES_AND_ACCESS_LEVEL_1}} |
| {{ACTOR_2}} | {{CAPABILITIES_AND_ACCESS_LEVEL_2}} |

## Scope

### In scope

- {{IN_SCOPE_CAPABILITY_1}}
- {{IN_SCOPE_CAPABILITY_2}}
- {{IN_SCOPE_CAPABILITY_3}}
- {{IN_SCOPE_CAPABILITY_4}}

### Out of scope

- {{EXPLICIT_NON_GOAL_1}}
- {{EXPLICIT_NON_GOAL_2}}
- {{EXPLICIT_NON_GOAL_3}}

## Domain

### {{CORE_ENTITY_OR_AGGREGATE_1}}

{{DESCRIPTION_OF_CORE_ENTITY_LIFECYCLE_OWNERSHIP_AND_IDENTITY}}

### {{CORE_ENTITY_OR_AGGREGATE_2}}

{{DESCRIPTION_OF_STABLE_VS_TRANSIENT_ATTRIBUTES_AND_STATE_MACHINE}}

```text
{{STATE_TRANSITION_DIAGRAM_EXAMPLE_ACTIVE_TO_COMPLETED_OR_CANCELLED}}
```

### {{CAPACITY_PRICING_OR_SPECIAL_DOMAIN_MODEL}}

{{EXPLANATION_OF_UNITS_INTEGERS_SNAPSHOTS_CALCULATIONS_AND_PRECISION}}

## Business Rules

- {{DURABLE_RULE_1_EG_ACCESS_CONTROL_BOUNDARY}}
- {{DURABLE_RULE_2_EG_CONCURRENCY_AND_TRANSACTIONAL_SAFETY}}
- {{DURABLE_RULE_3_EG_SNAPSHOT_IMMUTABILITY}}
- {{DURABLE_RULE_4_EG_INPUT_NORMALIZATION_OR_VALIDATION}}

## Relevant Limitations

- {{DELIBERATE_LIMITATION_OR_BREAKING_API_NOTE}}
- {{DATA_MIGRATION_OR_HISTORICAL_IMMUTABILITY_RULE}}
- {{SUPPORTED_ENUM_OR_CURRENCY_RESTRICTION}}

## Related documentation

- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
