<!--
Plantilla AGENTS.md — 2026

Objetivo: dar instrucciones operativas a Codex para ESTE repositorio.
No convertir AGENTS.md en documentación general ni en una colección de preferencias estéticas.
Mantenerlo corto, específico y verificable.
-->
# AGENTS.md

## Proyecto

{{SHORT_PROJECT_DESCRIPTION}}

{{IMPORTANT_STAGE_OR_CONSTRAINTS_OR_REMOVE}}

## Mapa del repositorio

<!-- Solo límites que ayuden a trabajar sin explorar de más. -->

- `{{PATH}}` — {{RESPONSIBILITY}}
- `{{PATH}}` — {{RESPONSIBILITY}}

## Comandos

<!-- Incluir solo comandos verificados en scripts/configuración reales. Eliminar filas no aplicables. -->

| Tarea | Comando |
|---|---|
| Instalar | `{{COMMAND}}` |
| Desarrollo | `{{COMMAND}}` |
| Test | `{{COMMAND}}` |
| Lint | `{{COMMAND}}` |
| Typecheck | `{{COMMAND}}` |
| Build | `{{COMMAND}}` |

## Reglas de ingeniería

- Sigue los patrones existentes antes de introducir otros nuevos.
- Haz el cambio coherente más pequeño que resuelva la tarea.
- Evita refactors no relacionados.
- No agregues dependencias sin necesidad concreta.
- No edites archivos generados manualmente.
- No debilites tests, validaciones o seguridad para hacer pasar un cambio.
- Conserva cambios no relacionados del usuario.
- Mantén tipos y contratos consistentes; evita casts usados solo para ocultar problemas de diseño.
- No hagas commit, push, merge, release ni despliegue salvo pedido explícito.

{{PROJECT_SPECIFIC_ENGINEERING_RULES_OR_REMOVE}}

## Límites

{{PROJECT_SPECIFIC_BOUNDARIES_OR_REMOVE}}

## Verificación

Antes de afirmar que terminaste, ejecuta los checks aplicables definidos por el proyecto.

No declares exitoso un check que no ejecutaste.

Si uno no puede ejecutarse, informa cuál, por qué y qué validación alternativa realizaste.

{{PROJECT_SPECIFIC_VALIDATION_OR_REMOVE}}

## Documentación

`docs/templates/` es la biblioteca reutilizable. Los documentos activos viven en la raíz o en `docs/`.

Principio:

> Crea solo documentación que reduzca ambigüedad, preserve conocimiento útil o haga reproducible el proyecto.

No inventes información ni crees archivos vacíos.

### Categorías

```text
personal
academico
cliente
```

#### Personal

Base: `README.md`.

Agrega otros documentos únicamente si aportan valor real.

#### Académico

Base habitual:

```text
README.md
docs/PROJECT.md
```

Agrega `SPECIFICATION.md` solo si existen requisitos o comportamientos que merecen formalización. El resto depende de la entrega y complejidad.

#### Cliente

Base habitual:

```text
README.md
docs/PROJECT.md
docs/SPECIFICATION.md
```

Agrega documentación técnica, operativa, de contribución o seguridad según responsabilidad real.

No expongas información confidencial, datos personales, credenciales, infraestructura privada ni detalles contractuales innecesarios.

### Activación

| Documento | Úsalo para |
|---|---|
| `PROJECT.md` | problema, alcance, objetivos, restricciones |
| `SPECIFICATION.md` | requisitos o comportamiento verificable |
| `ARCHITECTURE.md` | componentes, límites, datos e integraciones relevantes |
| `DEVELOPMENT.md` | setup y trabajo local no trivial |
| `TESTING.md` | estrategia de pruebas o quality gates que necesitan explicación |
| `DEPLOYMENT.md` | proceso real de entrega, validación y rollback |
| `OPERATIONS.md` | observabilidad, recuperación y mantenimiento |
| `adr/*.md` | decisiones técnicas significativas |
| `CONTRIBUTING.md` | colaboración sostenida o contribuciones externas |
| `SECURITY.md` | canal y política real de reporte de vulnerabilidades |

### Fuentes de verdad

- onboarding → `README.md`;
- alcance → `docs/PROJECT.md`;
- comportamiento → `docs/SPECIFICATION.md`;
- estructura técnica → `docs/ARCHITECTURE.md`;
- setup/comandos → `docs/DEVELOPMENT.md` y scripts reales;
- validación → `docs/TESTING.md`;
- entrega → `docs/DEPLOYMENT.md`;
- operación → `docs/OPERATIONS.md`;
- decisiones → `docs/adr/`;
- contribución → `CONTRIBUTING.md`;
- vulnerabilidades → `SECURITY.md`.

Para APIs HTTP, usa OpenAPI existente como contrato cuando corresponda; no dupliques todos los endpoints en Markdown.

### Impacto documental

```text
comportamiento     → SPECIFICATION
alcance/objetivo   → PROJECT
estructura         → ARCHITECTURE / ADR
setup/comandos     → DEVELOPMENT / README
pruebas            → TESTING
despliegue         → DEPLOYMENT
operación          → OPERATIONS
contribución       → CONTRIBUTING
seguridad/reportes → SECURITY
sin impacto        → no tocar docs
```

No actualices documentación por rutina antes de cada commit.

## AGENTS anidados

Crea un `AGENTS.md` o `AGENTS.override.md` más específico únicamente si una zona del repositorio tiene toolchain, convenciones o restricciones significativamente distintas.

No dupliques reglas globales en archivos anidados.

## Code Review Rules

<!-- Solo invariantes importantes que un linter o formatter no pueda expresar. Eliminar si no existen. -->
{{NON_OBVIOUS_REVIEW_INVARIANTS_OR_REMOVE}}

## Terminado

Una tarea termina cuando:

- el cambio solicitado funciona;
- pasan los checks aplicables o se explican las limitaciones;
- no se alteraron cambios ajenos sin necesidad;
- código, tests y documentación afectada están sincronizados;
- no quedan secretos, placeholders ni afirmaciones no verificadas introducidas por la tarea.
