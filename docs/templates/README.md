<!--
TEMPLATE CONTRACT
Target: /README.md
Activation: always
Mode: create-or-update
Primary responsibility: Onboarding, proof of working software, engineering signals, quick local setup, and navigation to deeper docs.
Primary sources: package manifests, lockfiles, scripts, environment examples, active docs, verified live deployment URLs.

Update rules:
- If README exists, update it in place and preserve useful verified content.
- Keep it concise and high-signal; move durable product/architecture/development details to dedicated docs in docs/.
- Generate links only for documents and URLs that actually exist and are verified.
- Never invent badges, URLs, commands, screenshots, licenses, features, metrics, or status claims.
- Remove this comment block, placeholders, and inapplicable optional sections in the active file.
-->

# {{PROJECT_NAME}}

> {{ONE_LINE_DESCRIPTION}}

{{TWO_TO_THREE_SENTENCE_OVERVIEW_EXPLAINING_PROBLEM_AUDIENCE_AND_INTENTIONAL_NON_GOALS}}

{{OPTIONAL_DEMO_SECTION}}

## Demo

- [Production web app]({{VERIFIED_PRODUCTION_WEB_URL}})
- [API health]({{VERIFIED_API_HEALTH_URL}})
  {{/OPTIONAL_DEMO_SECTION}}

{{OPTIONAL_SCREENSHOTS_SECTION}}

## Screenshots

### {{SURFACE_OR_WORKFLOW_NAME}}

![{{SCREENSHOT_ALT_TEXT}}]({{PATH_TO_SCREENSHOT}})

| {{WORKFLOW_A_NAME}}                    | {{WORKFLOW_B_NAME}}                    |
| -------------------------------------- | -------------------------------------- |
| ![{{ALT_A}}]({{PATH_TO_SCREENSHOT_A}}) | ![{{ALT_B}}]({{PATH_TO_SCREENSHOT_B}}) |
| {{/OPTIONAL_SCREENSHOTS_SECTION}}      |

## Key capabilities

- {{IMPLEMENTED_CAPABILITY_1}}
- {{IMPLEMENTED_CAPABILITY_2}}
- {{IMPLEMENTED_CAPABILITY_3}}
- {{IMPLEMENTED_CAPABILITY_4}}
- {{IMPLEMENTED_CAPABILITY_5}}

## Engineering highlights

- **{{HIGHLIGHT_TITLE_1}}.** {{CONCISE_EXPLANATION_OF_TECHNICAL_DISCIPLINE_OR_INVARIANT}}
- **{{HIGHLIGHT_TITLE_2}}.** {{CONCISE_EXPLANATION_OF_CONCURRENCY_SAFETY_OR_DATA_INTEGRITY}}
- **{{HIGHLIGHT_TITLE_3}}.** {{CONCISE_EXPLANATION_OF_DOMAIN_OR_FINANCIAL_CORRECTNESS}}
- **{{HIGHLIGHT_TITLE_4}}.** {{CONCISE_EXPLANATION_OF_CONTRACT_TYPING_OR_SCHEMA_SYNC}}
- **{{HIGHLIGHT_TITLE_5}}.** {{CONCISE_EXPLANATION_OF_TESTING_OR_QUALITY_GATES}}

## Architecture

```text
{{HIGH_LEVEL_TOPOLOGY_FLOW_EXAMPLE_BROWSER_TO_WEB_TO_API_TO_DB}}
```

{{CONCISE_SUMMARY_OF_SYSTEM_BOUNDARIES_CONTRACT_FLOW_AND_SOURCE_OF_TRUTH}}. See [Architecture](docs/ARCHITECTURE.md) for full dependency rules and data flow.

## Technology stack

- **{{STACK_CATEGORY_1}}:** {{TECHNOLOGY_LIST_1}}
- **{{STACK_CATEGORY_2}}:** {{TECHNOLOGY_LIST_2}}
- **{{STACK_CATEGORY_3}}:** {{TECHNOLOGY_LIST_3}}

## Repository structure

| Path         | Responsibility       |
| ------------ | -------------------- |
| `{{PATH_1}}` | {{RESPONSIBILITY_1}} |
| `{{PATH_2}}` | {{RESPONSIBILITY_2}} |
| `{{PATH_3}}` | {{RESPONSIBILITY_3}} |

## Local development

Prerequisites: {{VERIFIED_PREREQUISITES_EG_NODE_DOCKER_PYTHON_ETC}}.

```bash
{{MINIMAL_SETUP_COMMANDS_COPY_ENV_INSTALL_START_SERVICES}}
```

{{LOCAL_URLS_AND_PLATFORM_SPECIFIC_NOTES_OR_REMOVE}}

## Quality

```bash
{{QUALITY_CHECK_COMMANDS_FORMAT_LINT_TYPECHECK_TEST_BUILD}}
```

{{CONCISE_EXPLANATION_OF_CI_QUALITY_GATES_AND_PRE_RELEASE_REQUIREMENTS}}. See [Testing](docs/TESTING.md) for test boundaries and release verification.

## Documentation

- [Project](docs/PROJECT.md) — product scope, users, and durable domain rules.
- [Architecture](docs/ARCHITECTURE.md) — system boundaries, data flow, and dependency rules.
- [Development](docs/DEVELOPMENT.md) — local environment and workspace workflow.
  {{OPTIONAL_TESTING_LINK}}- [Testing](docs/TESTING.md) — test strategy, database setup, and quality gates.{{/OPTIONAL_TESTING_LINK}}
  {{OPTIONAL_DEPLOYMENT_LINK}}- [Deployment](docs/DEPLOYMENT.md) — production configuration, migrations, and validation.{{/OPTIONAL_DEPLOYMENT_LINK}}
  {{OPTIONAL_CUSTOM_DOC_LINK}}- [{{DOC_NAME}}](docs/{{DOC_FILE}}.md) — {{DOC_SUMMARY}}.{{/OPTIONAL_CUSTOM_DOC_LINK}}
