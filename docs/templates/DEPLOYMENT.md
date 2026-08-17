<!--
TEMPLATE CONTRACT
Target: /docs/DEPLOYMENT.md
Activation: deployment/release has non-trivial environments, CI/CD, sequencing, migrations, validation, or rollback/recovery knowledge.
Mode: create-or-update
Primary responsibility: repeatable delivery of the software from source to a running environment.
Primary sources: CI workflows, platform/infrastructure config, deployment scripts, migration tooling, verified environment configuration.

Do not create this document for a trivial one-command deploy that README/DEVELOPMENT can explain adequately.
Never document secret values or private credentials.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Deployment

> Environments, release flow, migrations, validation, and recovery procedures.

## Environments

| Environment | Purpose | Deployment source |
|---|---|---|
| {{ENVIRONMENT}} | {{PURPOSE}} | {{BRANCH_TAG_PIPELINE_OR_SOURCE}} |

## Release flow

```text
{{SOURCE}} -> {{CI_BUILD_TEST}} -> {{DEPLOYMENT_TARGET}} -> {{VALIDATION}}
```

{{RELEASE_NOTES_OR_REMOVE}}

## Configuration and secrets

- **Configuration source:** {{SOURCE}}
- **Secret management:** {{SAFE_DESCRIPTION}}

Never place real secret values in this document.

## Standard deployment

1. {{STEP}}
2. {{STEP}}
3. {{POST_DEPLOY_VALIDATION}}

## Database migrations

{{MIGRATION_ORDER_COMPATIBILITY_AND_FAILURE_STRATEGY_OR_REMOVE}}

## Validation

- {{HEALTH_SMOKE_OR_CRITICAL_FLOW_CHECK}}

## Rollback / recovery

{{REAL_ROLLBACK_FORWARD_FIX_OR_RECOVERY_STRATEGY}}

## Related documentation

- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Operations](OPERATIONS.md)
