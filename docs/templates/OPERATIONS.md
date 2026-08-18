<!--
TEMPLATE CONTRACT
Target: /docs/OPERATIONS.md
Activation: Live production system requires recurring operational knowledge such as health signals, log inspection, background jobs/queues, incident runbooks, backups, recovery, or maintenance.
Mode: create-or-update
Primary responsibility: Keeping a running system observable, diagnosable, and recoverable.
Primary sources: Actual monitoring/logging tooling, runbooks, infrastructure configurations, backup policies, incident learnings.

Update rules:
- Do not invent monitoring URLs, alert thresholds, RPO/RTO, or operational guarantees.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Operations

> Service health, observability, operational runbooks, backups, and recovery.

## Service health

| Signal                | Check                          | Expected result               |
| --------------------- | ------------------------------ | ----------------------------- |
| Liveness              | `GET {{HEALTH_ENDPOINT_PATH}}` | HTTP 200 `{ "status": "ok" }` |
| Database connectivity | `{{DATABASE_HEALTH_CHECK}}`    | {{EXPECTED_DB_RESULT}}        |

## Logs and observability

- **Structured logging:** Production logs output structured JSON via logger (e.g. Pino / Winston / Logback).
- **Log inspection:** Access platform logs through the provider dashboard or centralized log aggregator.
- **Sensitive data filtering:** Tokens, passwords, and sensitive PII are stripped before logging.

## Background jobs and queues

- **Worker process:** {{WORKER_OR_SCHEDULER_PROCESS}}
- **Failure policy:** {{RETRY_AND_DEAD_LETTER_POLICY}}

## Common incident runbooks

### {{INCIDENT_1_EG_COLD_START_OR_DB_POOL_EXHAUSTION}}

**Symptoms**

- {{SYMPTOM_DESCRIPTION_1}}

**Diagnosis**

```bash
{{DIAGNOSTIC_COMMAND_1}}
```

**Action**

1. {{MITIGATION_STEP_1}}
2. {{MITIGATION_STEP_2}}

## Backups and recovery

- **Protected data:** {{PRIMARY_DATABASE_AND_STORAGE_ASSETS}}
- **Backup mechanism:** Managed automated daily snapshots via provider.
- **Point-in-time recovery:** Available within provider retention window.

### Restore procedure

1. {{RESTORE_STEP_1}}
2. {{RESTORE_STEP_2}}

## Maintenance

- **Dependency audits:** Periodic security vulnerability checks via `pnpm audit` / `safety` / `mvn audit`.
- **Database index maintenance:** Periodic review of slow queries and database index usage.

## Related documentation

- [Deployment](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)
