---
name: write-tests
description: Use when writing, changing, or repairing automated tests, including flaky, intermittently failing, or timing-out tests and CI test failures. Choose the lowest reliable boundary, write deterministic tests by default, and fix flakes at their cause instead of raising timeouts or adding retries.
---

# Write Tests

Use this skill for test authoring and flake repair across stacks.

## Core contract

- Read the project's testing documentation, runner configuration, and existing fixtures/helpers first.
- Reuse established fixtures, readiness signals, data factories, and cleanup boundaries.
- Choose the lowest reliable boundary that observes the behavior under test.
- Keep one behavior per test; include the assertions needed to establish that behavior.
- Assert user-observable outcomes or public contracts rather than internal call sequences.
- Preserve project authorization and scope; this skill does not authorize data or dependency changes.
- Do not invent a passing verification result or report a retried pass as stable.
- Browser tests interact only after the project's application-readiness signal named in TESTING.md.

## Establish the boundary

Before writing a test:

1. Name the input or user action and the observable result.
2. Find the existing runtime boundary that owns the behavior.
3. Choose unit, component, integration, or E2E coverage accordingly.
4. Identify the state, external services, and asynchronous transitions it needs.
5. Find the project's command for running that boundary in isolation.

Use unit tests for pure domain decisions and transformations.
Use component tests for local rendering and user interaction.
Use integration tests for real database, authorization, or service boundaries.
Use E2E tests for critical workflows that need an actual browser or full system.

Do not move a test higher merely to avoid understanding a lower-level failure.
Do not mock away the boundary whose behavior the test claims to verify.

## Determinism rules

- Wait on observable conditions; never insert fixed sleeps to synchronize work.
- Control the clock when the result depends on time, including timezone and date boundaries.
- Seed or inject randomness when it affects expectations.
- Control network responses at the network boundary for isolated tests.
- Use real isolated services when integration with those services is the subject.
- Give each test ownership of its data and unique identifiers within its run.
- Derive unique values from test/run identity when parallel workers share infrastructure.
- Never depend on execution order, another test's records, or another test's mutations.
- Reset mocks, subscriptions, timers, and resources through established teardown.
- Observe asynchronous completion before asserting its result.
- Prefer semantic queries that describe how the user finds the control.

Keep fixtures small enough to explain the behavior without unrelated setup.
Await interactions and asynchronous assertions; do not let work escape the test.
For eventual state, retry the observation, not a mutation that may run twice.

## Timeout doctrine

Treat timeouts as budgets, not synchronization mechanisms.

- Set test, action, assertion, and async-utility budgets once in framework configuration.
- Size configured budgets for CI hardware and the intended test boundary.
- Keep inner waits below the enclosing test budget.
- Never introduce per-test or per-wait timeout overrides.
- Never disable a budget or raise it to conceal a failing test.
- Name the condition that never became true when a budget expires.

Distinguish a locator/action failure, an assertion failure, a test-budget expiry,
and a job timeout. Each points to a different boundary.
Inspect the earliest useful failure and its diagnostics rather than assuming slow CI.
Change a shared budget only for a justified configuration requirement, with evidence;
a budget change is not proof that a flaky test has been repaired.

## Flake protocol

A flaky or timing-out test is a defect. Follow this protocol before calling it fixed.

### 1. Reproduce

- Preserve the failing command, environment, seed, worker count, and diagnostics.
- Run the affected test or file repeatedly without retries.
- Also run its containing suite when shared state or order may matter.
- Reproduce under representative load when rendering or CPU contention is implicated.
- Record failures and successful first attempts separately.

If it does not reproduce, inspect the original trace and compare environments.
Do not claim a cause or stability proof from one successful local run.

### 2. Classify

Use the evidence to identify the condition that failed:

- readiness/hydration race: interaction occurred before handlers or state were ready;
- shared state or order dependency: records, globals, or mocks leaked between tests;
- animation/focus timing: the expected interactive state had not been reached;
- CPU-bound render: expensive setup or interaction consumed the budget;
- real application race: concurrent work produced an invalid observable result;
- real regression reported as a timeout: the expected result will never appear.

Trace the first missing condition back to its owner.
Do not classify every missing element as an infrastructure delay.

### 3. Fix the cause

- Repair fixture readiness, data ownership, teardown, or observable waits for test races.
- Reduce unnecessary rendering/setup when the test is doing excessive work.
- Repair application behavior when the race or regression belongs to the application.
- Keep the original behavioral assertion so the fix preserves coverage.
- Do not fix with increased timeouts, extra retries, sleeps, skips, or weaker assertions.

Quarantine only with a tracked issue, a named cause or investigation, and a restoration
condition. Keep the defect visible and follow the project's authorization requirements.

### 4. Prove stability

- Run at least 10 repetitions of the repaired test without retries.
- Include the containing file or suite when isolation or order was implicated.
- Include representative load when that was needed to reproduce the defect.
- Record the command, number of runs, environment, and first-attempt results.

If the failure remains, revisit the classification rather than growing the budget.
Honor the project's verification stop conditions; report the remaining failure and hypothesis.

## Stability proof before done

- Run the smallest relevant suite and the project's required checks.
- Repeat new or changed E2E tests, for example with Playwright `--repeat-each=5`.
- Run new heavy component test files repeatedly, including their fixture setup.
- Disable retries for stability runs so a retried pass cannot hide a defect.
- Report flaky results as defects even when CI's diagnostic retry passes.
- Permit at most one E2E retry in CI; never retry unit or integration suites.
- Surface each flaky E2E result in a warning and the job summary.
- State unavailable checks or unreproduced failures explicitly.

## Stack references

Read only the reference matching the project's tools before authoring tests:

- [Playwright](references/playwright.md): readiness fixture, configured budgets, browser assertions, and lint guards.
- [Testing Library](references/testing-library.md): asynchronous queries, user interaction, timers, and lint guards.

For another runner, apply the same contracts using its existing project configuration.
Do not add a testing framework merely to use these examples.
