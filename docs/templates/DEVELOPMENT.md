<!--
TEMPLATE CONTRACT
Target: /docs/DEVELOPMENT.md
Activation: setup/environment/workspace/database/development workflow is too detailed for README quick start.
Mode: create-or-update
Primary responsibility: how to work in the repository locally and safely.
Primary sources: manifests, lockfiles, scripts, tool configs, env examples, Docker/devcontainer files, database tooling, repository structure.

README should keep only the shortest getting-started path and link here for details.
Do not explain generic Git/language/package-manager concepts unless the repository has a project-specific rule.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Development

> Local setup, environment, commands, and repository-specific development workflow.

## Requirements

| Tool | Supported / required version | Source |
|---|---|---|
| {{TOOL}} | {{VERSION_OR_RANGE}} | {{MANIFEST_CONFIG_OR_DOC}} |

## Initial setup

```bash
{{VERIFIED_SETUP_COMMANDS}}
```

## Environment

Use `.env.example` or the repository's equivalent as the canonical variable list when available.

| Variable | Required | Purpose |
|---|:---:|---|
| `{{VARIABLE}}` | {{YES_NO}} | {{PURPOSE}} |

{{ENVIRONMENT_PRECEDENCE_OR_SPECIAL_RULES_OR_REMOVE}}

Never document real secret values.

## Run locally

```bash
{{VERIFIED_DEVELOPMENT_COMMANDS}}
```

{{LOCAL_SERVICES_OR_URLS_OR_REMOVE}}

## Commands

| Task | Command | Notes |
|---|---|---|
| Install | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |
| Development | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |
| Test | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |
| Lint | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |
| Typecheck | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |
| Build | `{{COMMAND}}` | {{NOTES_OR_EMPTY}} |

## Repository workflow

<!-- Project-specific workflow only. -->

1. {{NORMAL_DEVELOPMENT_STEP}}
2. {{NORMAL_DEVELOPMENT_STEP}}

## Workspace / monorepo workflow

<!-- Keep only if applicable. -->

| Workspace / package | Responsibility | Common command/filter |
|---|---|---|
| `{{WORKSPACE}}` | {{RESPONSIBILITY}} | `{{COMMAND_OR_FILTER}}` |

{{WORKSPACE_DEPENDENCY_RULES_REFERENCE_OR_REMOVE}}

## Database workflow

<!-- Keep only if applicable. Never invent migration/seed/reset commands. -->

### Start / connect

```bash
{{DATABASE_START_OR_CONNECT_COMMANDS}}
```

### Migrations

```bash
{{MIGRATION_COMMANDS}}
```

### Seed / test data

```bash
{{SEED_COMMANDS_OR_REMOVE}}
```

{{DATABASE_SAFETY_NOTES_OR_REMOVE}}

## Code conventions

<!-- Only project-specific conventions not already enforced/obvious from formatter, linter, or language defaults. -->

- {{CONVENTION}}

## Dependency policy

- Prefer an existing or platform-native solution when it is simpler and adequate.
- Add a dependency when it materially reduces complexity, risk, or maintenance cost.
- Do not add architecturally significant production dependencies as a hidden side effect of another task.

{{PROJECT_SPECIFIC_DEPENDENCY_RULES_OR_REMOVE}}

## Common tasks

### {{TASK_NAME}}

```bash
{{COMMANDS}}
```

{{TASK_NOTES_OR_REMOVE}}

## Troubleshooting

### {{REAL_RECURRING_PROBLEM}}

**Symptom:** {{SYMPTOM}}

**Fix:** {{VERIFIED_FIX}}

## Related documentation

<!-- Keep only active links that exist. -->

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
