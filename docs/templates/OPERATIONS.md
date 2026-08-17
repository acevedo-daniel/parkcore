<!--
TEMPLATE CONTRACT
Target: /docs/OPERATIONS.md
Activation: live service requires recurring operational knowledge such as health checks, logs, incidents, backups, queues/jobs, recovery, or maintenance.
Mode: create-or-update
Primary responsibility: keep a running system observable, diagnosable, and recoverable.
Primary sources: actual monitoring/logging tooling, runbooks, infrastructure config, backup/jobs config, incident learnings.

Do not invent monitoring URLs, alert thresholds, RPO/RTO, backup policies, or operational guarantees.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Operations

> Health, observability, recurring operational tasks, incidents, and recovery.

## Service health

| Signal | How to verify | Expected result |
|---|---|---|
| {{HEALTH_ERROR_LATENCY_QUEUE_ETC}} | {{CHECK}} | {{EXPECTED_RESULT}} |

## Logs and observability

{{WHERE_AND_HOW_TO_INSPECT_WITHOUT_EXPOSING_PRIVATE_CREDENTIALS}}

## Background jobs / queues

{{JOBS_QUEUES_SCHEDULERS_AND_FAILURE_HANDLING_OR_REMOVE}}

## Common incidents

### {{INCIDENT}}

**Symptoms**

- {{SYMPTOM}}

**Diagnosis**

```bash
{{SAFE_DIAGNOSTIC_COMMAND_OR_REMOVE}}
```

**Action**

1. {{ACTION}}
2. {{ACTION}}

## Backups and recovery

- **Protected data:** {{DATA}}
- **Backup mechanism:** {{REAL_BACKUP_MECHANISM}}
- **RPO:** {{REAL_RPO_OR_REMOVE}}
- **RTO:** {{REAL_RTO_OR_REMOVE}}

### Restore procedure

{{RESTORE_STEPS_OR_RUNBOOK_REFERENCE}}

## Maintenance

{{REAL_RECURRING_MAINTENANCE_OR_REMOVE}}

## Related documentation

- [Deployment](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)
