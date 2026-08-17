<!--
TEMPLATE CONTRACT
Target: /README.md
Activation: always
Mode: create-or-update
Primary responsibility: onboarding and shortest reliable path to understand and run the project.
Primary sources: repository name/description, manifests, scripts, environment example, active docs, deployed/public links only when verified.

Update rules:
- If README exists, update it in place and preserve useful verified content.
- Keep it concise; move durable product/architecture/development detail to their dedicated docs when those docs exist.
- Generate links only for documents that actually exist.
- Never invent badges, URLs, commands, screenshots, licenses, features, metrics, or status claims.
- Remove this comment, placeholders, and empty optional sections in the active file.
-->
# {{PROJECT_NAME}}

> {{ONE_LINE_DESCRIPTION}}

{{OPTIONAL_VERIFIED_BADGES_OR_REMOVE}}

{{OPTIONAL_PRIMARY_LINKS_OR_REMOVE}}

{{OPTIONAL_PREVIEW_OR_REMOVE}}

## Overview

{{TWO_TO_FOUR_SENTENCE_PROJECT_OVERVIEW}}

## Features

<!-- Implemented capabilities only. Omit this section for libraries/tools where Usage is clearer. -->

- {{IMPLEMENTED_CAPABILITY}}
- {{IMPLEMENTED_CAPABILITY}}

## Stack

<!-- Major technologies only; detailed dependency lists belong in manifests. -->

- **{{AREA}}:** {{TECHNOLOGY}}
- **{{AREA}}:** {{TECHNOLOGY}}

## Getting started

### Prerequisites

- {{VERIFIED_PREREQUISITE}}

### Install

```bash
{{VERIFIED_INSTALL_COMMANDS}}
```

### Environment

{{MINIMAL_ENVIRONMENT_SETUP_OR_REMOVE}}

### Run

```bash
{{VERIFIED_RUN_COMMAND}}
```

{{LOCAL_URL_OR_USAGE_RESULT_OR_REMOVE}}

## Commands

<!-- Keep only meaningful top-level commands verified from the repository. -->

| Task | Command |
|---|---|
| Development | `{{COMMAND}}` |
| Test | `{{COMMAND}}` |
| Lint | `{{COMMAND}}` |
| Typecheck | `{{COMMAND}}` |
| Build | `{{COMMAND}}` |

{{OPTIONAL_MINIMAL_USAGE_SECTION_OR_REMOVE}}

## Documentation

<!-- Include only files that exist. Omit the whole section if there is no additional active documentation. -->

- [Project](docs/PROJECT.md) — product scope, workflows, constraints, and durable decisions.
- [Architecture](docs/ARCHITECTURE.md) — system boundaries, components, and dependency rules.
- [Development](docs/DEVELOPMENT.md) — local setup and development workflow.
- [Testing](docs/TESTING.md) — testing strategy and required verification.
- [Deployment](docs/DEPLOYMENT.md) — deployment and rollback procedures.
- [Operations](docs/OPERATIONS.md) — service operation and recovery.
- [Security](SECURITY.md) — security reporting/policy.

{{OPTIONAL_LICENSE_OR_REMOVE}}
