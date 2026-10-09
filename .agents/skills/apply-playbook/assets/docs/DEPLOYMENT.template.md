<!--
TEMPLATE — DEPLOYMENT.md
Place: /docs/DEPLOYMENT.md
When: the project has a real deployment with non-trivial configuration, sequencing, or migrations.
Rules:
- Describe the deployment that exists, not hypothetical alternatives.
- Never include secret values.
- Delete sections that do not apply.
- Remove this comment before use.
-->

# <FILL: Project Name> — Deployment

> Production topology, configuration, release flow, and rollback.

## Production topology

```text
<FILL: hosted infrastructure topology flow>
```

| Component | Platform | Responsibility |
| --- | --- | --- |
| `<FILL: component name>` | <FILL: hosting platform / target> | <FILL: operational responsibility> |

## Release flow

```text
<FILL: release sequence from commit to live environment>
```

<FILL: what CI automates and what triggers deployment>

## Rollback

<FILL: how to return to the previous release, how long it takes, and what cannot be rolled back, such as applied migrations>

<!-- <OPTIONAL: include once per hosted component> -->
## <FILL: Component Name>

- **Config:** `<FILL: manifest / dockerfile / config path>`
- **Build:** `<FILL: build command>`
- **Start:** `<FILL: startup command>`
- **Validation:** <FILL: health check endpoint or verification command>

## Production configuration

| Variable | Component | Requirement |
| --- | --- | --- |
| `<FILL: VARIABLE_NAME>` | `<FILL: component>` | <FILL: rule without secret values> |

<!-- <OPTIONAL: include only when production database migrations exist> -->
## Database migrations

```bash
<FILL: production migration command>
```

Safety rules:
- <FILL: pre-deployment backup, rolling migration rule, or backward-compatibility constraint>

<!-- <OPTIONAL: include when deployment has post-release verification> -->
## Validation

```bash
<FILL: smoke test or post-deployment validation command>
```

<FILL: what the validation proves>

## Related documentation

<!-- List only documents that actually exist. -->
- [<FILL: Document Name>](<FILL: relative path>)
