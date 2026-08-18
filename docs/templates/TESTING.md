<!--
TEMPLATE CONTRACT
Target: /docs/TESTING.md
Activation: Testing has multiple layers, special setup/data, critical-path expectations, or non-obvious quality gates.
Mode: create-or-update
Primary responsibility: Testing strategy, test boundaries, data setup, coverage expectations, and release verification.
Primary sources: Test suites, test runners/configs, scripts, CI definitions, fixtures/factories, container/database setup.

Update rules:
- Do not invent coverage targets or test layers the repository does not use.
- Describe strategy, boundaries, critical behavior, and verified execution commands.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Testing

> Test strategy, boundaries, data setup, and release verification.

## Strategy

{{EXPLANATION_OF_WHAT_THE_PROJECT_VERIFIES_WHERE_BOUNDARIES_ARE_ENFORCED_AND_MOCKING_PHILOSOPHY}}

## Test layers

| Layer                                 | Purpose       | Tool / location     |
| ------------------------------------- | ------------- | ------------------- |
| {{LAYER_1_EG_API_UNIT_AND_ROUTE}}     | {{PURPOSE_1}} | {{TOOL_AND_PATH_1}} |
| {{LAYER_2_EG_WEB_COMPONENT_AND_FORM}} | {{PURPOSE_2}} | {{TOOL_AND_PATH_2}} |
| {{LAYER_3_EG_CONTRACT_DRIFT}}         | {{PURPOSE_3}} | {{TOOL_AND_PATH_3}} |
| {{LAYER_4_EG_MOCKED_E2E_WORKFLOW}}    | {{PURPOSE_4}} | {{TOOL_AND_PATH_4}} |
| {{LAYER_5_EG_REAL_STACK_SMOKE}}       | {{PURPOSE_5}} | {{TOOL_AND_PATH_5}} |

## Test data and dependencies

- **Database isolation:** {{EXPLANATION_OF_HOW_TEST_DATABASES_ARE_PROVISIONED_AND_ISOLATED}}
- **Mocking boundary:** {{WHAT_IS_MOCKED_VS_WHAT_CALLS_REAL_SERVICES_IN_CI}}
- **Disposable entities:** {{POLICY_FOR_E2E_SMOKE_TESTS_AGAINST_DEPLOYED_ENVIRONMENTS}}

## Critical behavior under test

- **{{CRITICAL_BEHAVIOR_1}}:** {{CONCISE_EXPLANATION}}
- **{{CRITICAL_BEHAVIOR_2}}:** {{CONCISE_EXPLANATION}}
- **{{CRITICAL_BEHAVIOR_3}}:** {{CONCISE_EXPLANATION}}

## Run tests

```bash
{{COMMAND_FORMAT_CHECK}}
{{COMMAND_RUN_UNIT_TESTS}}
{{COMMAND_RUN_COVERAGE}}
{{COMMAND_RUN_E2E}}
{{COMMAND_CHECK_CONTRACTS}}
```

{{OPTIONAL_REAL_STACK_SMOKE_COMMAND_BLOCK}}

## Coverage

| Workspace / Module | Lines / Statements   | Branches                |
| ------------------ | -------------------- | ----------------------- |
| `{{AREA_1}}`       | {{PERCENT_LINES_1}}% | {{PERCENT_BRANCHES_1}}% |
| `{{AREA_2}}`       | {{PERCENT_LINES_2}}% | {{PERCENT_BRANCHES_2}}% |

## Required verification

Before handing off code or merging a release:

```bash
{{FULL_RELEASE_READINESS_COMMAND_OR_CHAIN}}
```

## Related documentation

- [README](../README.md)
- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT.md)
