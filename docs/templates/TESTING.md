<!-- Crear solo cuando la estrategia de pruebas necesite explicación. -->
# Pruebas

## Estrategia

{{WHAT_NEEDS_CONFIDENCE_AND_WHY}}

## Niveles utilizados

| Nivel | Propósito | Herramienta / ubicación |
|---|---|---|
| {{UNIT_INTEGRATION_E2E}} | {{PURPOSE}} | {{TOOL_OR_PATH}} |

## Ejecutar pruebas

```bash
{{TEST_COMMANDS}}
```

## Comportamientos críticos

- {{CRITICAL_PATH}}
- {{BUSINESS_OR_SECURITY_RULE}}

## Datos y dependencias externas

{{FIXTURES_MOCKS_SANDBOX_TESTCONTAINERS_OR_REMOVE_SECTION}}

## Quality gates

Antes de integrar cambios relevantes:

- {{TEST_GATE}}
- {{LINT_TYPECHECK_BUILD_GATE}}

La cobertura es una señal; no reemplaza assertions útiles ni casos de prueba relevantes.
