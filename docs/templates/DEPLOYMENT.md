<!-- Crear solo si existe un proceso real de despliegue. -->
# Despliegue

## Entornos

| Entorno | Propósito | Fuente de despliegue |
|---|---|---|
| {{ENVIRONMENT}} | {{PURPOSE}} | {{BRANCH_TAG_PIPELINE}} |

## Flujo

{{CI_CD_AND_PLATFORM_SUMMARY}}

## Configuración y secretos

- **Configuración:** {{SOURCE}}
- **Secretos:** {{SAFE_SECRET_MANAGEMENT_DESCRIPTION}}

Nunca documentar valores secretos.

## Despliegue estándar

1. {{STEP}}
2. {{STEP}}
3. {{POST_DEPLOY_VALIDATION}}

## Migraciones

{{MIGRATION_STRATEGY_OR_REMOVE_SECTION}}

## Validación

- {{HEALTH_OR_SMOKE_CHECK}}
- {{CRITICAL_FLOW_CHECK}}

## Rollback o recuperación

{{REAL_ROLLBACK_OR_FORWARD_FIX_STRATEGY}}
