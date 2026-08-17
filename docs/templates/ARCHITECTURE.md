<!--
TEMPLATE CONTRACT
Target: /docs/ARCHITECTURE.md
Activation: meaningful runtime/component boundaries, dependency rules, persistent data, external integrations, or architectural invariants exist.
Mode: create-or-update
Primary responsibility: how the system is structured and which boundaries implementation must preserve.
Primary sources: source tree, imports/dependencies, runtime/configuration, database/schema, integration code, accepted ADRs, PROJECT locked decisions.

Do not document every directory/class/file. Do not repeat package manifests. Keep only architecture that changes where code belongs or how components interact.
Keep adaptive sections only when relevant to the repository shape.
Remove this comment, placeholders, and empty optional sections in the active file.
-->
# Architecture

> System structure, boundaries, dependency rules, data ownership, and architectural invariants.

## System overview

{{HIGH_LEVEL_ARCHITECTURE_SUMMARY}}

## System topology

<!-- Keep Mermaid only if it clarifies relationships. -->

```mermaid
flowchart LR
    {{TOPOLOGY}}
```

## Repository boundaries

<!-- Show only meaningful ownership boundaries. -->

| Area | Responsibility | May depend on |
|---|---|---|
| `{{PATH_OR_COMPONENT}}` | {{RESPONSIBILITY}} | {{ALLOWED_DEPENDENCIES}} |

## Runtime components

| Component | Responsibility | Runtime / technology |
|---|---|---|
| {{COMPONENT}} | {{RESPONSIBILITY}} | {{TECHNOLOGY_OR_RUNTIME}} |

## Dependency rules

<!-- Write explicit allowed/forbidden relationships when they matter. -->

- {{DEPENDENCY_RULE}}
- {{FORBIDDEN_DEPENDENCY_RULE}}

## Critical flows

### {{FLOW_NAME}}

```text
{{STEP}} -> {{STEP}} -> {{STEP}}
```

{{FLOW_NOTES_OR_REMOVE}}

## Data ownership

| Data / state | Owner | Storage / source of truth | Notes |
|---|---|---|---|
| {{DATA}} | {{OWNER}} | {{SOURCE}} | {{NOTES}} |

## Cross-cutting concerns

### Validation

{{VALIDATION_BOUNDARY_OR_REMOVE}}

### Errors

{{ERROR_MODEL_OR_REMOVE}}

### Authentication and authorization

{{AUTH_BOUNDARIES_OR_REMOVE}}

### Configuration and secrets

{{CONFIG_BOUNDARY_OR_REMOVE}}

### Logging / observability

{{OBSERVABILITY_BOUNDARY_OR_REMOVE}}

## External systems

| System | Purpose | Boundary / failure behavior |
|---|---|---|
| {{EXTERNAL_SYSTEM}} | {{PURPOSE}} | {{BOUNDARY_AND_FAILURE_BEHAVIOR}} |

## Architectural invariants

<!-- High-value rules an agent must not violate during ordinary implementation. -->

- {{INVARIANT}}

## Known trade-offs

- {{INTENTIONAL_TRADEOFF_OR_REMOVE}}

## Web application concerns

<!-- Keep only for a web UI when these choices are architecturally meaningful. -->

- **Rendering model:** {{RENDERING_MODEL}}
- **Routing/layout ownership:** {{ROUTING_AND_LAYOUT_RULE}}
- **State ownership:** {{STATE_RULE}}
- **Data fetching:** {{DATA_FETCHING_RULE}}
- **Server/client boundary:** {{SERVER_CLIENT_RULE_OR_REMOVE}}
- **UI/domain boundary:** {{UI_DOMAIN_RULE}}

## API/service concerns

<!-- Keep only for an API/service. -->

- **Request lifecycle:** {{REQUEST_LIFECYCLE}}
- **Contract/validation boundary:** {{API_CONTRACT_RULE}}
- **Application/domain boundary:** {{APPLICATION_DOMAIN_RULE}}
- **Persistence boundary:** {{PERSISTENCE_RULE}}
- **Background work:** {{BACKGROUND_WORK_RULE_OR_REMOVE}}

## Monorepo concerns

<!-- Keep only for a workspace/monorepo. -->

- **Workspace ownership:** {{WORKSPACE_RULE}}
- **Package responsibilities:** {{PACKAGE_RESPONSIBILITY_RULE}}
- **Allowed import graph:** {{IMPORT_RULE}}
- **Shared contracts:** {{SHARED_CONTRACT_RULE_OR_REMOVE}}
- **Build/runtime coupling:** {{BUILD_COUPLING_RULE_OR_REMOVE}}

## Library / CLI concerns

<!-- Keep only for a library or CLI. -->

- **Public surface:** {{PUBLIC_API_OR_COMMAND_RULE}}
- **Compatibility:** {{COMPATIBILITY_RULE}}
- **Packaging:** {{PACKAGING_RULE_OR_REMOVE}}

## Related decisions

<!-- Link only accepted/relevant ADRs that exist. -->

- [ADR-{{NNN}}: {{TITLE}}](adr/{{NNN}}-{{SLUG}}.md)
