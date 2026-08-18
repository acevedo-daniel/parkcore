<!--
TEMPLATE CONTRACT
Target: /docs/DEVELOPMENT.md
Activation: Setup, environment configuration, database workflow, or workspace commands are too detailed for README quick start.
Mode: create-or-update
Primary responsibility: Local setup, environment boundary, commands, database lifecycle, and developer workflow.
Primary sources: Manifests, lockfiles, package scripts, tool configs, environment examples, Docker Compose, database tooling.

Update rules:
- Keep only verified commands and real configuration keys.
- Clearly separate local defaults from production secrets.
- Never write real secret values in documentation.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Development

> Local setup, environment boundary, and developer workflow.

## Requirements

| Tool       | Required version | Source                         |
| ---------- | ---------------- | ------------------------------ |
| {{TOOL_1}} | {{VERSION_1}}    | {{SOURCE_1_EG_PACKAGE_JSON}}   |
| {{TOOL_2}} | {{VERSION_2}}    | {{SOURCE_2_EG_DOCKER_COMPOSE}} |

## Initial setup

```bash
{{COMMAND_TO_COPY_API_ENV_EXAMPLE}}
{{COMMAND_TO_COPY_WEB_ENV_EXAMPLE}}
{{COMMAND_TO_INSTALL_DEPENDENCIES}}
{{COMMAND_TO_START_CONTAINERS_OR_DATABASE}}
{{COMMAND_TO_RUN_MIGRATIONS_AND_SEEDS}}
{{COMMAND_TO_START_DEV_SERVERS}}
```

{{OS_SPECIFIC_NOTES_FOR_POWERSHELL_VS_UNIX}}

## Environment boundary

`.env` files are ignored by version control. Copy the example files, keep real credentials outside Git, and never expose backend secrets in browser-facing variables.

### Local development

| Variable         | Required locally | Purpose       |
| ---------------- | :--------------: | ------------- |
| `{{VAR_NAME_1}}` |    {{YES_NO}}    | {{PURPOSE_1}} |
| `{{VAR_NAME_2}}` |    {{YES_NO}}    | {{PURPOSE_2}} |

### Production configuration

| Variable         | Required | Production rule       |
| ---------------- | :------: | --------------------- |
| `{{PROD_VAR_1}}` |   Yes    | {{PRODUCTION_RULE_1}} |
| `{{PROD_VAR_2}}` |   Yes    | {{PRODUCTION_RULE_2}} |

## Run locally

```bash
{{DEV_COMMAND}}
```

- {{LOCAL_SERVICE_1_URL}}
- {{LOCAL_SERVICE_2_URL}}

## Commands

| Task           | Command                      | Notes                   |
| -------------- | ---------------------------- | ----------------------- |
| Start database | `{{DB_UP_COMMAND}}`          | {{DB_UP_NOTES}}         |
| Setup / seed   | `{{DB_SETUP_COMMAND}}`       | {{DB_SETUP_NOTES}}      |
| Develop        | `{{DEV_COMMAND}}`            | {{DEV_NOTES}}           |
| Format check   | `{{FORMAT_CHECK_COMMAND}}`   | {{FORMAT_NOTES}}        |
| Lint           | `{{LINT_COMMAND}}`           | {{LINT_NOTES}}          |
| Typecheck      | `{{TYPECHECK_COMMAND}}`      | {{TYPECHECK_NOTES}}     |
| Test           | `{{TEST_COMMAND}}`           | {{TEST_NOTES}}          |
| Contract check | `{{CONTRACT_CHECK_COMMAND}}` | {{CONTRACT_NOTES}}      |
| Build          | `{{BUILD_COMMAND}}`          | {{BUILD_NOTES}}         |
| Release check  | `{{RELEASE_CHECK_COMMAND}}`  | {{RELEASE_CHECK_NOTES}} |

## Database workflow

```bash
{{START_DATABASE_COMMAND}}
{{APPLY_MIGRATIONS_AND_SEED_COMMAND}}
```

- **Forward migrations only:** Database schema evolutions use committed forward migrations.
- **Destructive operations:** Never run migration resets or volume purges against environments with data that must be preserved.
- **Seeding:** Demo seeds populate coherent test entities and must not overwrite user-created records.

## Dependency and security policy

- Add dependencies only when they materially reduce complexity, risk, or maintenance cost.
- Document any required package manager overrides or security pins with explicit rationale and revisit conditions.

## Related documentation

- [README](../README.md)
- [Project](PROJECT.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
