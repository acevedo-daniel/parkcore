<!-- Crear solo para un servicio vivo que realmente se opera y mantiene. -->
# Operación

## Salud del servicio

| Señal | Cómo verificar |
|---|---|
| {{HEALTH_ERRORS_LATENCY_ETC}} | {{CHECK}} |

## Logs y observabilidad

{{WHERE_AND_HOW_TO_INSPECT_WITHOUT_EXPOSING_PRIVATE_URLS}}

## Alertas e incidentes habituales

### {{INCIDENT}}

**Síntomas**

- {{SYMPTOM}}

**Diagnóstico**

```bash
{{SAFE_DIAGNOSTIC_COMMAND}}
```

**Acción**

1. {{ACTION}}
2. {{ACTION}}

## Backups y recuperación

- **Datos protegidos:** {{DATA}}
- **Política:** {{BACKUP_POLICY}}
- **RPO:** {{RPO_OR_REMOVE}}
- **RTO:** {{RTO_OR_REMOVE}}

### Restauración

{{RESTORE_PROCEDURE_OR_RUNBOOK_REFERENCE}}

<!-- No registrar fechas de "restauración verificada" aquí si van a quedar obsoletas; usar evidencia operativa o registros apropiados. -->

## Mantenimiento

{{REAL_RECURRING_MAINTENANCE_OR_REMOVE_SECTION}}
