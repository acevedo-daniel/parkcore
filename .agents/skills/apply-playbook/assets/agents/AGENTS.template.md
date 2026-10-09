# <FILL: Project Name> - Agent Instructions

## Project

<FILL: 1-2 sentences describing the product, repository purpose, and current runtime maturity.>

## Commands

| Task | Command |
| --- | --- |
| Verify (mirrors CI Gate) | `<FILL: one command that runs every CI Gate check locally>` |
| Install | `<FILL: install command>` |
| Dev | `<FILL: development command>` |
| Format check | `<OPTIONAL: format check command; delete the row if none>` |
| Lint | `<FILL: lint command>` |
| Type check | `<FILL: type-check command>` |
| Test | `<FILL: test command>` |
| E2E | `<OPTIONAL: E2E command; delete the row if none>` |
| Build | `<FILL: build command>` |
| Screenshots | `<OPTIONAL: command that regenerates README screenshots from deterministic demo data; delete the row if the project has no UI>` |

## Key paths

Source: `<FILL: source path>`; tests: `<FILL: test path>`; configuration: `<FILL: configuration path>`; documentation: `<FILL: documentation path>`.

## Technology

- **Language / Runtime:** <FILL: language and runtime version>
- **Framework:** <FILL: framework>
- **Persistence:** <OPTIONAL: persistence technology; delete this line if none>
- **Package / Build tooling:** <FILL: package manager and build tool>
- **Key boundaries:** <OPTIONAL: short architecture or directory map; delete this line if unnecessary>

## Code rules

- <FILL: repository-specific module and ownership conventions>
- <FILL: validation, error handling, type-safety, or architectural invariants>
- Do not modify generated artifacts manually.
- Do not commit secrets, credentials, production data, or personal data.

## Always

- Run the Verify command before reporting work as done; never claim a check passed unless it ran.
- If the same check fails after two fix attempts, stop and report the command, the output, and your hypothesis.
- Never weaken, skip, or retry a check to make it pass.
- Engineering artifacts (code, docs, branches, commits, PRs) are in English; user-facing copy follows `design/PROJECT-DESIGN.md` › Voice.
- Planning labels (phase, task, and milestone numbers) never appear in branches, commits, PRs, files, or identifiers.
- Current code is evidence of what exists; `DEVELOPMENT-ROADMAP.md`, `design/PROJECT-DESIGN.md`, and `design/UI-SPEC.md` are the approved target.
- `local-docs/` is git-ignored and never linked from tracked files: active plans in `execution/`, issue drafts in `issues/`, human-kept material in `keep/`, and every other agent-written file (scripts, PR text, screenshots, build output) in `tmp/`. Deleting `tmp/` contents, plans whose PRs merged, and posted issue drafts needs no confirmation; never delete `keep/`.

## Ask before

- Adding, removing, or upgrading a dependency.
- Changing a database schema, migration, or persisted data.
- Deleting files, data, or public API surface.
- Changing CI workflows, repository settings, or branch protection.
- Editing an approved decision document (`DEVELOPMENT-ROADMAP.md`, `design/PROJECT-DESIGN.md`, `design/UI-SPEC.md`).
- Creating branches, commits, pushes, or pull requests that were not requested.

## Skills

| Work | Skill |
| --- | --- |
| Plan a feature, phase, or refactor | `plan-implementation` |
| Implement a planned task, fix, or feature | `implement-task` |
| Write or repair tests | `write-tests` |
| Set up or change CI or protect main | `setup-ci` |
| Branch, commit, PR, or merge text | `git-delivery` |
| Visual direction and design tokens | `define-design` |
| Any visible UI change or visual review | `build-ui` |
| Hand work to a teammate | `delegate-task` |
| Bootstrap or audit this project against the playbook | `apply-playbook` |
| Record a recurring agent mistake | `record-lesson` |
<!-- <OPTIONAL: include when teammates receive tasks as GitHub issues> -->
## Delegation

- **Issue language:** <FILL: language of delegated issue titles and bodies, e.g. Spanish>
- **Tracker:** <FILL: GitHub Project owner and number, or repository issues only>

Delegated issues are written with the `delegate-task` skill or the Task issue form. If an issue does not match the repository or the next step is unclear, comment on the issue and wait.
