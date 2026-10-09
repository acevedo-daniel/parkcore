<!--
TEMPLATE — TESTING.md
Place: /docs/TESTING.md
When: testing has multiple meaningful layers, special data, or release gates.
Rules:
- Prefer the lowest reliable testing boundary: Unit → Integration → E2E.
- Include only test layers the repository actually has.
- Do not invent target percentages or describe mocks as real-stack tests.
- Local test commands must reproduce CI validation checks.
- Delete sections that do not apply.
- Remove this comment before use.
-->

# <FILL: Project Name> — Testing

> Test strategy, layers, data, and how to run them.

## Strategy

<FILL: what the project verifies, how confidence is distributed across test boundaries, and what isolation guarantees each layer provides.>

Use **Unit → Integration → E2E** as the preferred boundary order, not as a required percentage distribution or fixed shape.

## Test layers

| Layer | Purpose | Tool / location |
| --- | --- | --- |
| Unit | <FILL: domain logic, rules, pure services without external infrastructure> | `<FILL: runner and path, e.g. vitest tests/unit>` |
| Integration | <FILL: queries, transactions, repository implementations, framework boundaries> | `<FILL: runner and path, e.g. vitest tests/integration>` |
| E2E | <FILL: critical user journeys and browser flows through the running application> | `<FILL: runner and path, e.g. playwright tests/e2e>` |

<!-- <OPTIONAL: include when tests require fixtures, databases, or non-obvious setup> -->
## Test data and dependencies

### <FILL: test area>

<FILL: how test data is provisioned, isolated, or reset (e.g. test containers, seed fixtures, deterministic data)>

## Run tests

Run the Test and E2E commands in [AGENTS.md › Commands](../AGENTS.md#commands).

<FILL: setup a run needs beyond those commands, such as starting a test database; delete this line if none>

<!-- <OPTIONAL: include when browser or full-system flows require explanation> -->
## End-to-end verification

### <FILL: critical workflow name>

<FILL: boundary notes, browser requirements, or runtime constraints>

<!-- <OPTIONAL: include when the project has E2E or timing-sensitive tests> -->
## Reliability

Test authoring and flaky-test repair follow the `write-tests` skill.

- **Application readiness:** <FILL: explicit readiness signal and fixture path; delete this item when there are no browser tests>
- **Configured budgets:** <FILL: test, action, assertion, and async-utility budgets for each runner, and their configuration paths; no per-test or per-wait timeout overrides>
- **CI retry policy:** <FILL: E2E retry configuration (at most once); unit and integration suites never retry>
- **Flaky reporting:** <FILL: warning annotations and job-summary reporting for every flaky E2E result, plus retained diagnostic artifacts; delete this item when there are no E2E tests>
- **Lint guards:** <FILL: rules and configuration paths preventing fixed sleeps, timeout overrides, focused tests, and browser tests bypassing the readiness fixture, as applicable>

Test budgets, readiness, and flaky-test handling follow the `write-tests` skill; CI gates follow the `setup-ci` skill.

<!-- <OPTIONAL: include when CI has meaningful pipeline job stages> -->
## CI and quality gates

<FILL: pipeline jobs (Quality, Tests, Integration, Contract, E2E, Production, Docker; or scoped <Gate> / <Scope>) and the required CI Gate merge contract protecting main>

## Related documentation

<!-- List only documents that actually exist. -->
- [<FILL: Document Name>](<FILL: relative path>)
