<!--
TEMPLATE — CLAUDE.md
Place: /CLAUDE.md (root)
When: the project uses Claude Code as a coding agent.
Purpose: Claude-specific instructions pointing to canonical AGENTS.md.
Rules:
- Start with the literal `@AGENTS.md` import.
- AGENTS.md is the canonical source of project knowledge; do not duplicate it here.
- Only include behaviors strictly unique to Claude Code in this file.
- Remove this comment before use.
-->

@AGENTS.md

## Claude Code-specific behavior

- Use Claude Code's Plan Mode for complex or multi-file changes when explicit planning is useful before editing.
- Use `/memory` to inspect which `CLAUDE.md` files and imported instructions are active when context needs verification.
- Keep private, machine-specific preferences in `CLAUDE.local.md`; do not add them to this shared wrapper.
- Claude Code loads skills from .claude/skills/ and ~/.claude/skills/; the playbook sync script fills both.
