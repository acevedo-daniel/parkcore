<!--
TEMPLATE CONTRACT
Target: /docs/TESTING.md
Activation: testing has multiple layers, special setup/data, critical-path expectations, or non-obvious quality gates.
Mode: create-or-update
Primary responsibility: what confidence the project expects and how that confidence is verified.
Primary sources: test suites, test config, scripts, CI, fixtures/factories, container/test database setup.

Do not invent coverage targets or test layers the repository does not use.
Do not duplicate every test case; describe strategy, boundaries, critical behavior, and commands.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Testing

> Testing strategy, test boundaries, data setup, and required verification.

## Strategy

{{WHAT_THE_PROJECT_NEEDS_CONFIDENCE_IN_AND_WHY}}

## Test layers

<!-- Keep only layers actually used or explicitly being established now. -->

| Layer | Purpose | Tool / location |
|---|---|---|
| {{UNIT_COMPONENT_INTEGRATION_E2E_CONTRACT}} | {{PURPOSE}} | {{TOOL_OR_PATH}} |

## Boundaries

- {{WHAT_BELONGS_IN_THIS_TEST_LAYER_OR_WHAT_SHOULD_NOT_BE_MOCKED}}

## Run tests

```bash
{{VERIFIED_TEST_COMMANDS}}
```

## Test data

{{FIXTURES_FACTORIES_SEEDS_TEST_DB_STRATEGY_OR_REMOVE}}

## External dependencies

{{MOCK_SANDBOX_TESTCONTAINER_OR_REAL_SERVICE_POLICY_OR_REMOVE}}

## Critical behavior

<!-- Durable high-risk paths, not a duplicate of the entire suite. -->

- {{CRITICAL_FLOW_OR_RULE}}

## Required verification

<!-- Match actual scripts/CI. Keep only applicable checks. -->

Before considering a relevant change complete:

```bash
{{TEST_COMMAND}}
{{LINT_COMMAND_OR_REMOVE}}
{{TYPECHECK_COMMAND_OR_REMOVE}}
{{BUILD_COMMAND_OR_REMOVE}}
```

{{MANUAL_OR_SMOKE_VALIDATION_OR_REMOVE}}

## Coverage

<!-- Keep only if the project has a real coverage policy. -->

{{REAL_COVERAGE_EXPECTATION_OR_REMOVE}}

## Related documentation

- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
