<!--
TEMPLATE CONTRACT
Target: /docs/ARCHITECTURE.md
Activation: System has meaningful component boundaries, dependency rules, persistent data, external integrations, or architectural invariants.
Mode: create-or-update
Primary responsibility: System structure, component boundaries, dependency rules, data ownership, contract flow, and architectural invariants.
Primary sources: Directory layout, import/dependency graphs, schema/database models, API contracts, CI/deployment topology, accepted ADRs.

Update rules:
- Do not document every class or trivial file.
- Keep only architecture that defines where code belongs, how components interact, and what invariants must not be broken.
- Adapt sections according to the system's shape (Monorepo, API, SPA, CLI, etc.).
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Architecture

## Summary

{{CONCISE_SUMMARY_OF_SYSTEM_TOPOLOGY_MONOREPO_OR_SERVICE_STRUCTURE_AND_CONTRACT_FLOW}}

```mermaid
flowchart LR
    {{TOPOLOGY_FLOW_EXAMPLE_BROWSER_TO_WEB_TO_API_TO_DATABASE}}
```

## Workspace boundaries

| Workspace / Area | Owns                         | Must not own                     |
| ---------------- | ---------------------------- | -------------------------------- |
| `{{AREA_1}}`     | {{OWNED_RESPONSIBILITIES_1}} | {{FORBIDDEN_RESPONSIBILITIES_1}} |
| `{{AREA_2}}`     | {{OWNED_RESPONSIBILITIES_2}} | {{FORBIDDEN_RESPONSIBILITIES_2}} |
| `{{AREA_3}}`     | {{OWNED_RESPONSIBILITIES_3}} | {{FORBIDDEN_RESPONSIBILITIES_3}} |

## Backend / API internals

The backend maintains a strict unidirectional dependency flow:

```text
route -> controller -> service -> repository -> database/ORM
```

- **Controllers:** Untrusted transport boundary. Parse and validate parameters, query, and request body against schemas.
- **Services:** Business logic and authorization. Enforce domain invariants and orchestrate transactional work.
- **Repositories:** Persistence boundary. Execute database queries and data mapping.
- **Mappers/Contracts:** Produce explicit, typed response objects (e.g. ISO-8601 timestamps, integer currencies).

## Contract flow

```text
API Schema / OpenAPI registrations
  -> pnpm/npm contract generate
  -> openapi.json / schema artifact
  -> Typed API client generation
  -> Typed frontend/consumer client
```

{{EXPLANATION_OF_HOW_CONTRACT_DRIFT_IS_DETECTED_AND_CHECKED_IN_CI}}

## Frontend architecture

- **Rendering & Routing:** {{ROUTING_AND_RENDERING_MODEL}}
- **Server State:** {{SERVER_STATE_MANAGEMENT_EG_TANSTACK_QUERY}}
- **Shareable State:** {{URL_SEARCH_PARAMS_FOR_PAGINATION_AND_FILTERS}}
- **Local State:** {{LOCAL_COMPONENT_STATE_FOR_TRANSIENT_UI}}
- **Boundary Rules:** {{FRONTEND_IMPORT_RESTRICTIONS_EG_NEVER_IMPORT_BACKEND_ORMS}}

## Hosted topology

{{HOSTED_DEPLOYMENT_TARGETS_EXPLANATION_EG_VERCEL_RENDER_NEON_AWS}}

- The frontend connects to the backend over HTTPS using public build-time configuration (`VITE_API_URL` or equivalent).
- The API is the sole component with credentials to connect to the persistent database.
- Cross-Origin Resource Sharing (CORS) and Content Security Policy (CSP) restrict browser access strictly to approved endpoints.

## Invariants and trade-offs

- **{{INVARIANT_TITLE_1}}:** {{INVARIANT_EXPLANATION_1}}
- **{{INVARIANT_TITLE_2}}:** {{INVARIANT_EXPLANATION_2}}
- **{{TRADEOFF_TITLE_1}}:** {{TRADEOFF_EXPLANATION_1}}

## Related documentation

- [Project](PROJECT.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
