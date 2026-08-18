<!--
TEMPLATE CONTRACT
Target: /docs/DEPLOYMENT.md
Activation: Deployment has non-trivial environments, CI/CD, sequencing, forward migrations, hosted blueprints, or verification knowledge.
Mode: create-or-update
Primary responsibility: Repeatable delivery of the software from source to running hosted environments.
Primary sources: CI workflows, platform configurations, deployment blueprints, migration tooling, verified production environment variables.

Update rules:
- Keep only real deployment targets and verified configuration keys.
- Never document secret values or private credentials.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# Deployment

> Environments, hosted topology, release flow, database migrations, and validation.

## Environments

| Environment | Purpose                                           | Deployment source                                |
| ----------- | ------------------------------------------------- | ------------------------------------------------ |
| Local       | Development and disposable database verification  | `{{LOCAL_ORCHESTRATION_SOURCE_EG_COMPOSE}}`      |
| Production  | Live user-facing applications and persistent data | `{{PRODUCTION_PLATFORMS_EG_VERCEL_RENDER_NEON}}` |

## Deployment targets

```text
{{TOPOLOGY_FLOW_EXAMPLE_BROWSER_TO_HOSTED_WEB_TO_HOSTED_API_TO_MANAGED_DB}}
```

| Component         | Selected target | Responsibility       |
| ----------------- | --------------- | -------------------- |
| `{{COMPONENT_1}}` | {{PLATFORM_1}}  | {{RESPONSIBILITY_1}} |
| `{{COMPONENT_2}}` | {{PLATFORM_2}}  | {{RESPONSIBILITY_2}} |
| `{{COMPONENT_3}}` | {{PLATFORM_3}}  | {{RESPONSIBILITY_3}} |

## Release flow

```text
source -> CI checks -> database migration -> API deployment -> web deployment -> health validation
```

CI verifies code quality, tests, and contract synchronization. Production releases are triggered from approved branches only after CI checks pass.

## Platform service configurations

### {{BACKEND_OR_API_SERVICE}}

- **Blueprint / Manifest:** `{{PATH_TO_MANIFEST_OR_BLUEPRINT}}`
- **Build command:** `{{BUILD_AND_MIGRATION_COMMAND}}`
- **Start command:** `{{START_COMMAND}}`
- **Health check path:** `{{HEALTH_ENDPOINT_PATH_EG_HEALTHZ}}`

### {{FRONTEND_OR_WEB_SERVICE}}

- **Configuration:** `{{PATH_TO_CONFIG_EG_VERCEL_JSON}}`
- **Build command:** `{{FRONTEND_BUILD_COMMAND}}`
- **Output directory:** `{{OUTPUT_DIRECTORY_EG_DIST}}`
- **SPA routing:** Catch-all rewrite ensures client-side routing and browser refresh return `index.html`.
- **Security headers:** Enforce Content Security Policy (CSP) restricting `connect-src` to approved API origins.

## Configuration and secrets

- **Backend secrets:** Set in the hosting platform's secure environment store (e.g. database connection strings, JWT signing keys, CORS allowed origins).
- **Frontend variables:** Set public build-time variables (e.g. `VITE_API_URL`) during the static build. Never put secrets in client bundles.

## Database migrations

Database migrations use committed forward migration scripts:

```bash
{{APPLY_MIGRATIONS_DEPLOY_COMMAND}}
```

Verify migration status without modifying data:

```bash
{{CHECK_MIGRATION_STATUS_COMMAND}}
```

- **Production safety:** Never run migration resets or destructive seeds against production databases.
- **Rollout sequence:** Apply forward migrations before or during the new backend deployment.

## Validation

- **Health check:** `GET {{HEALTH_ENDPOINT_PATH}}` returns `200 OK` with `{ "status": "ok" }` and `Cache-Control: no-store`.
- **Remote smoke test:**
  ```bash
  {{SMOKE_CHECK_COMMAND}}
  ```
- **Real-stack verification:** Validate critical workflows against deployed environments using disposable credentials.

## Related documentation

- [Development](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
