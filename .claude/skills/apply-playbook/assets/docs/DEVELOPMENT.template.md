<!--
TEMPLATE — DEVELOPMENT.md
Place: /docs/DEVELOPMENT.md
When: local setup or developer workflow is too detailed for the README.
Rules:
- Do not assume any specific database, container runtime, or package manager.
- Keep production config and release steps in DEPLOYMENT.md.
- When the project has no AGENTS.md, list every command here instead of linking.
- Delete sections that do not apply.
- Remove this comment before use.
-->

# <FILL: Project Name> — Development

> Local setup, environment, and developer workflow.

## Requirements

| Tool | Version | Source |
| --- | --- | --- |
| <FILL: tool/runtime> | <FILL: version> | `<FILL: source file / manifest>` |

## Setup

```bash
<FILL: setup and dependency installation commands>
```

<FILL: OS-specific notes or prerequisite instructions, or delete if not needed>

<!-- <OPTIONAL: include when environment variables matter locally> -->
## Local environment

| Variable | Required | Purpose |
| --- | :---: | --- |
| `<FILL: VARIABLE_NAME>` | <FILL: Yes / No> | <FILL: purpose and valid format> |

Never include real secrets.

## Run locally

```bash
<FILL: local startup / dev server command>
```

<FILL: local URLs or verification endpoints>

## Commands

Every project command is listed in [AGENTS.md › Commands](../AGENTS.md#commands); Verify mirrors the CI Gate.

<!-- <OPTIONAL: include when a command needs more than its name, such as arguments, side effects, or ordering> -->
| Command | Notes |
| --- | --- |
| `<FILL: command>` | <FILL: what to know before running it> |

<!-- <OPTIONAL: include when local database or state requires workflow commands> -->
## Database workflow

```bash
<FILL: migration, seed, or local database reset commands>
```

<FILL: migration and seed policies>

## Related documentation

<!-- List only documents that actually exist. -->
- [<FILL: Document Name>](<FILL: relative path>)
