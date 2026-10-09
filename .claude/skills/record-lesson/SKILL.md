---
name: record-lesson
description: Use when the user says an agent keeps making the same mistake, asks to "add this to the playbook", "remember this for every project", or "agregalo al playbook", or when a fix reveals a rule every project should follow. Records the lesson in the playbook skill that owns that work, as a check when it can be mechanical, and prepares a pull request to the playbook.
---

# Record Lesson

Use this skill to turn an observed, recurring mistake into a durable playbook change.

## Core contract

- One lesson, one owner: the skill whose work produced the mistake. Never create a standalone document.
- Prefer a mechanical check (a CI step, lint rule, or template guard), then a line in the owning skill, then an `AGENTS.md` Always rule only when it applies to every task.
- Record only what was observed. Cite the project and the file, PR, or session where it happened.
- Write the lesson as one imperative, testable line.

## Steps

1. Ask for the playbook path when it is unknown; never guess it.
2. State the mistake, where it happened, and the rule that would have prevented it. Confirm this with the user before editing.
3. Find the owning skill in the playbook README's skill catalog. When none fits, stop and propose a new skill or owner instead of forcing the lesson somewhere.
4. Search the owner for a line that already covers the case. Tighten that line instead of adding a second one.
5. Make the change. For a check, edit the owning skill's asset or reference. For a rule, add a line under `## Gotchas` at the end of the owning SKILL.md, creating that section if it is missing.
6. Follow the `git-delivery` skill for the branch, commit, and PR when the user asks for them.
7. Remind the user to run the playbook sync script after the merge so machines and projects receive the change.
