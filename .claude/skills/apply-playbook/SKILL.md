---
name: apply-playbook
description: Bootstrap selected playbook templates into a new project, audit an existing project for playbook conformance and write a fix plan, or clean local working files. Use when the user asks to "apply the playbook", "bootstrap docs", "sync with the playbook", "audit playbook conformance", "clean local-docs", or "limpiar local-docs".
---

# Apply Playbook

Use this skill to bootstrap selected playbook documents into a new project, inspect an existing project for playbook conformance, or clean its local working files.

## Core contract

- Bootstrap reads templates from this skill's assets/ folder. Ask for the playbook path only for the skill drift check.
- Use the target project path supplied by the user, or the current workspace only when the user clearly identifies it as the target.
- Bootstrap creates the selected documents. Sync/audit keeps target-project files read-only: report findings and write only a plan under `local-docs/execution/`; wait for `Implement Task N` before changing target files.
- Preserve accurate project-specific content. Do not invent product facts, architecture, commands, or legal requirements.

## Choose a mode

- **Bootstrap:** the user is starting a project and wants selected playbook documents materialized.
- **Sync/audit:** the user wants an existing project checked or aligned with the playbook. Keep this mode read-only.
- **Clean local-docs:** run `scripts/check_local_docs.py --fix <project>`, report what it deleted, and list remaining findings with a proposed destination (`keep/`, `tmp/`, or delete). Move or delete findings only after the user confirms.

Resolve script paths relative to this skill's directory and pass the project's absolute path. Run Python scripts with `python` (`python3` where `python` is unavailable).

If the target or mode is unclear, ask before acting.

## Documents

Create only documents with a distinct responsibility; use an existing document when the information fits there.

| Document | Owns | Must not own |
| --- | --- | --- |
| README | Identity, proof, capabilities, engineering signals, quick start, navigation | Deep domain rules, full architecture, exhaustive setup |
| PROJECT | Product purpose, scope, workflows, business rules | Technical implementation, setup, deployment |
| ARCHITECTURE | Components, boundaries, data flow, invariants, trade-offs | Product marketing, setup commands, ops procedures |
| DEVELOPMENT | Local setup, environment, commands, database workflow | Production config, release runbooks |
| TESTING | Strategy, layers, data/dependencies, commands | Product scope, testing theory |
| DEPLOYMENT | Topology, configuration, release flow, migrations | Generic cloud advice, hypothetical hosting |
| DEVELOPMENT-ROADMAP | Direction, phase sequencing, scope boundaries, exit criteria | Implementation details, issue tracking, changelog |
| PROJECT-DESIGN | Product visual direction, color/type/geometry tokens | View-level specs, component implementation |
| UI-SPEC | View specs, states, responsive rules, component behavior | Visual direction, global principles |

## Evidence and decisions

- Evidence documents describe current reality verified against source, runtime configuration, and tests.
- Decision documents define the approved target; existing code is transformed to match it.
- Decide choices, ask for missing facts, and never write `<TBD>`, pending statuses, or candidate lists.
- A specification becomes approved only when the user accepts it.
- Materialized specifications change `status: template` to `status: approved`; roadmaps use `status: active`.
- Do not add artificial frontmatter to public or operational evidence documents, or manual `version:` or `last_reviewed:` metadata; Git owns revision history.

## Documentation presentation

- Use sentence-case headings and short paragraphs.
- Use tables when structure helps and code blocks for real commands and schemas.
- Use relative links and list only related documents that exist.
- Keep public documentation in clear professional English.

## Bootstrap a new project

1. Select only documents justified by the project's purpose and tooling from this skill's `assets/` folder. PROJECT-DESIGN and UI-SPEC are created only through `define-design`, and DEVELOPMENT-ROADMAP and PLAN only through `plan-implementation`; route those documents to their skills instead of copying their templates.
2. Inspect the target project's requirements, source, manifests, tests, CI, and deployment configuration for facts needed by the selected documents.
3. Copy each selected template to its destination and adapt its content in place.
4. Follow the Evidence and decisions contract above for each selected document.
5. Fill required `<FILL: instruction>` content; delete inapplicable optional sections and remove the `<OPTIONAL: condition>` markers from sections you keep. Remove template header comments and all unfilled placeholders. Verify commands, paths, links, versions, environment keys, URLs, and screenshots against the project.
6. Keep headings and section order consistent with the templates while retaining only content relevant to this project.

Sources containing `.template.` drop that segment when materialized (for example, `PROJECT.template.md` becomes `PROJECT.md`). Keep native GitHub filenames canonical and install `LICENSE-MIT` as `LICENSE`.

## Sync or audit an existing project

Keep all inspection read-only. Inventory its documentation, manifests, source tree, tests, CI, deployment configuration, agent instructions, and installed skills. Classify relevant documents as **RETAIN**, **UPDATE**, **MERGE**, or **REMOVE**, with evidence for each proposed action.

Check these conformance points when they apply:

- Compare project documents with their corresponding playbook templates. For `AGENTS.md`, compare the section headings and order with `assets/agents/AGENTS.template.md`, preserving valid project-specific instructions.
- Run `scripts/check_local_docs.py <project>` in report mode. Turn each FINDING into a fix task: durable material moves to `keep/`, and the task also updates tracked paths that referenced the old location (grep for them); disposable material moves to `tmp/` or is deleted with the user's confirmation. Flag an `AGENTS.md` whose `local-docs/` rule differs from the template.
- Inspect `.github/workflows/ci.yml` for a placeholder guard that rejects unfilled `<FILL: ...>` and `<OPTIONAL: ...>` markers and template headers left in the project.
- Confirm the workflow defines the stable `CI Gate` job.
- Resolve `OWNER` and `REPO` from the target repository's configured GitHub remote before querying its Ruleset.
- When GitHub access is available, inspect the main branch Ruleset read-only with `gh api "repos/$OWNER/$REPO/rulesets"`. Check that an active Ruleset targets `main` and requires `CI Gate`; report unavailable access rather than guessing.
- Compare `.agents/skills/PLAYBOOK_VERSION` with the playbook HEAD (`git -C <playbook> rev-parse --short HEAD`) and use `diff -r` for each vendored playbook skill in both `.agents/skills/` and `.claude/skills/`. Report missing markers, missing skills, and drift; preserve project-specific skills. The fix is running `scripts/sync-skills.sh --project <path>` from the playbook (PowerShell: `scripts/sync-skills.ps1 -Project <path>`), never hand edits. Check user-level installs only when in scope; do not assume project copies are required.
- Preserve accurate project-specific details. Flag stale, duplicate, missing, or out-of-scope content rather than editing it.

## Report findings

Return a findings table with these columns: **ID**, **File**, **Evidence** (`path:line`), **Severity**, and **Action**. Keep evidence specific and distinguish verified facts from inferences.

For sync/audit, write a queue-ready plan from the adjacent `../plan-implementation/assets/PLAN.template.md` to `local-docs/execution/<slug>.md`. Include only actions supported by findings, resolve missing facts before marking the plan ready, and do not edit the target project until the user asks for `Implement Task N`.
