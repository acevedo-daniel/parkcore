<!-- Crear solo si varias personas contribuyen o se aceptan contribuciones externas. -->
# Contribuir

## Antes de empezar

- Revisa el `README.md` y la documentación relevante.
- Comprueba si ya existe un issue, tarea o cambio equivalente cuando el proyecto use ese flujo.
- Mantén cada cambio enfocado y evita refactors no relacionados.

## Desarrollo local

{{DEVELOPMENT_DOC_REFERENCE_OR_MINIMAL_SETUP}}

No dupliques aquí un setup completo si ya existe `docs/DEVELOPMENT.md`.

## Calidad

Antes de proponer un cambio, ejecuta los checks aplicables del proyecto:

```bash
{{RELEVANT_CHECKS}}
```

No debilites pruebas o controles para hacer pasar un cambio.

## Pull requests

- Describe qué cambia y por qué.
- Mantén el alcance acotado.
- Incluye pruebas o evidencia proporcional al riesgo del cambio.
- Actualiza documentación solo cuando cambie su fuente de verdad.
- Señala migraciones, breaking changes o pasos manuales cuando existan.

{{PROJECT_SPECIFIC_PR_RULES_OR_REMOVE}}

## Issues y propuestas

{{REAL_ISSUE_OR_DISCUSSION_CHANNELS_OR_REMOVE}}

<!-- No imponer Conventional Commits, nombres de ramas u otras convenciones salvo que el proyecto realmente las use. -->
