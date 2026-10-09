---
name: delegate-task
description: Use when the user asks to delegate a plan task to a teammate ("Delegate Task N", "delegar la Task N"), to create an issue for a teammate ("crear issue", "create an issue for"), or to hand off ad-hoc work such as a manual check, research, data gathering, documentation, or a small fix. Write one self-contained issue that follows the project's Task issue form.
---

# Delegate Task

Use this skill to turn a plan task or an ad-hoc request into a GitHub issue a teammate can finish without the owner.

## Core contract

- The issue is the teammate's only context. They never see the plan, `local-docs/`, or this conversation.
- Follow the project's Task issue form exactly; do not invent another format.
- Link only tracked files, routes, and URLs. Never link `local-docs/`.
- Planning labels (phase, task, and milestone numbers) never appear in the title or body; see the `git-delivery` skill.
- Run `gh` mutations only when the user explicitly asks to create the issue. Otherwise return the draft.

## Inputs

- A plan task (`Delegate Task N`), marked `Delegable` or not.
- An ad-hoc request with no plan, such as "investigate X" or "check the sign-up flow on mobile".

If other tasks in the plan depend on the requested task, say which ones will wait and ask before continuing.

## Format

Read, in order:

1. `AGENTS.md` › Delegation for the issue language and the tracker;
2. the project's `.github/ISSUE_TEMPLATE/task.yml`, or `assets/task.yml` next to this skill when the project has none.

Ask the user for the issue language or tracker when `AGENTS.md` does not set them.

Write the body as one `### <label>` section per form field, in form order, using the form's labels. This is the body GitHub produces when someone fills the form by hand, so manual and drafted issues look the same. Use one of the Deliver options verbatim. Omit optional fields that would be empty.

## Write

- **Title:** the outcome in imperative form, in the issue language; no tags or prefixes.
- **Goal:** what is true when done and why it matters to the product, in one or two sentences.
- **Context:** the exact doc sections, routes, files, or URLs to read first; for a running app, the environment URL.
- **Steps:** concrete enough for someone new to the codebase. For a manual check, one scenario per step with the route, input, viewport when relevant, and expected result taken from the approved specification. For a fix, reproduce the bug with a failing test first.
- **Done when:** checkboxes with observable results.
- **Out of scope:** what a teammate is likely to touch but must not.

Save the draft to `local-docs/issues/<outcome-slug>.md` with the title as a first-line comment, `<!-- title: <title> -->`, which GitHub does not render, and show the user the title, the body, and a suggested assignee when the user named the team.

## Create

When the user asks to create it:

```bash
gh issue create --title "<title>" --body-file local-docs/issues/<outcome-slug>.md [--assignee <login>]
gh project item-add <number> --owner <owner> --url <issue-url>   # only when AGENTS.md sets a tracker
```

After the issue is created, delete the draft; the issue is the record.

When the issue came from a plan, set that task's Progress row to Status `delegated` with `#<issue>` in Commit.

## Final check

- the body follows the form's labels and order;
- a teammate can finish it from the issue alone;
- no `local-docs/` link or planning label;
- the issue language matches `AGENTS.md` › Delegation;
- nothing was created on GitHub without an explicit request.
