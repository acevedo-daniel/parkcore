<!--
TEMPLATE — GEMINI.md
Place: /GEMINI.md (root)
When: the project uses Gemini or Google Antigravity as a coding agent.
Purpose: Gemini-specific instructions pointing to canonical AGENTS.md.
Rules:
- Start with the literal `@AGENTS.md` import when the Gemini context import feature is enabled.
- AGENTS.md is the canonical source of project knowledge; do not duplicate it here.
- Only include behaviors strictly unique to Gemini / Antigravity in this file.
- Remove this comment before use.
-->

@AGENTS.md

## Gemini / Antigravity-specific behavior

- Use `/memory show` to verify which Gemini context files are loaded when context needs verification.
- Use `/memory reload` after changing context files during an active Gemini CLI session.
- Keep Gemini-specific settings and personal preferences in the appropriate Gemini configuration, not in this shared wrapper.
