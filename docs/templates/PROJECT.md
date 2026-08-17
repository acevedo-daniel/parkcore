<!--
TEMPLATE CONTRACT
Target: /docs/PROJECT.md
Activation: product/project-level scope, workflows, constraints, locked decisions, or unresolved durable decisions need a source of truth.
Mode: create-or-update
Primary responsibility: what the project is, why it exists, what belongs in it, and which high-level decisions implementation must respect.
Primary sources: user/project intent, current implementation, existing docs, accepted ADRs.

Do not duplicate architecture internals, detailed setup, endpoint catalogs, or task-specific implementation plans here.
Keep durable business rules here only when they define the product globally; feature-local acceptance criteria belong in plans/tests.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Project

> Product scope, core workflows, constraints, and durable project direction.

## Overview

{{WHAT_THE_SOFTWARE_IS_AND_WHY_IT_EXISTS}}

## Problem

{{PROBLEM_OR_OPPORTUNITY}}

## Users

<!-- Keep only actual user/actor groups that affect product behavior. -->

| User / actor | Need |
|---|---|
| {{USER_OR_ACTOR}} | {{NEED}} |

## Core workflows

<!-- Describe user/system outcomes, not implementation details. -->

1. {{CORE_WORKFLOW}}
2. {{CORE_WORKFLOW}}

## Scope

### In scope

- {{IN_SCOPE_CAPABILITY_OR_RESPONSIBILITY}}

### Out of scope

- {{EXPLICIT_NON_GOAL}}

## Product rules

<!-- Keep only durable cross-feature rules. Omit if ordinary behavior is already clear in code/tests. -->

- {{DURABLE_PRODUCT_OR_BUSINESS_RULE}}

## Success criteria

<!-- Observable outcomes, not vanity metrics invented by the agent. -->

- {{SUCCESS_CRITERION}}

## Technical direction

<!-- High-level direction only. Detailed boundaries belong in ARCHITECTURE.md. -->

| Area | Direction |
|---|---|
| Runtime | {{RUNTIME_OR_REMOVE_ROW}} |
| Frontend | {{FRONTEND_OR_REMOVE_ROW}} |
| Backend | {{BACKEND_OR_REMOVE_ROW}} |
| Data | {{DATABASE_OR_PERSISTENCE_OR_REMOVE_ROW}} |
| Authentication | {{AUTH_DIRECTION_OR_REMOVE_ROW}} |
| Deployment | {{DEPLOYMENT_DIRECTION_OR_REMOVE_ROW}} |

## Locked decisions

<!-- Decisions implementation must respect until explicitly reconsidered. Do not invent entries just to fill the section. -->

- **locked:** {{DECISION}}

## Open decisions

<!-- An unresolved decision is not permission for an implementation task to decide it silently. -->

| Decision | Status | Blocking | Notes |
|---|---|:---:|---|
| {{DECISION}} | unresolved | {{YES_NO}} | {{NOTES_OR_EMPTY}} |

## Constraints

<!-- Product/technical constraints that materially affect implementation. -->

- {{CONSTRAINT}}

## Current state

{{SHORT_FACTUAL_DESCRIPTION_OF_WHAT_EXISTS_NOW}}

## Current focus

{{CURRENT_PROJECT_LEVEL_FOCUS_OR_REMOVE}}

## Related documentation

<!-- Keep only links to active files that exist. -->

- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Architecture decisions](adr/)
