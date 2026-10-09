<!--
TEMPLATE — README.md
Place: /README.md
When: always — every project needs an entry point.

Portfolio README rules:
- In the upper half, answer what it is, who it serves, what it can do, where to see it, and what merits engineering review (60-second rule).
- Choose 3–5 verified engineering decisions and support claims with evidence, not adjectives.
- Use 1440 × 900 desktop screenshots at 100% zoom without browser chrome, coherent demo data, and no secrets.
- UI-SPEC's README screenshot column decides which views, states, and layout modes appear here. Regenerate them with the Screenshots command in AGENTS.md; never capture them by hand.
- Keep 2–4 WebP screenshots under docs/screenshots/ with descriptive filenames and alt text that states what each image proves.
- When the product supports light and dark schemes, show the default scheme; add the other with a <picture> element only when it changes the product's impression.
- Delete optional sections that do not apply and the <OPTIONAL: ...> marker of every section you keep. Do not invent badges, URLs, screenshots, features, or metrics.
- Remove this comment before use.
-->

# <FILL: Project Name>

<!-- <OPTIONAL: include only when automated CI is actively configured> -->
[![CI](<FILL: CI badge image URL>)](<FILL: CI workflow URL>)

> <FILL: concise one-line project description>

<FILL: short 1-2 sentence overview of core value and user outcome>

<!-- <OPTIONAL: include only when a verified live app, API, or demo exists> -->
**[<FILL: Action label, e.g. Open Live Application>](<FILL: verified production or demo URL>)**

<!-- <OPTIONAL: include only when images materially prove the interface> -->
## Screenshots

### <FILL: Primary view or workflow name>

| <FILL: Left screen caption> | <FILL: Right screen caption> |
| --- | --- |
| ![<FILL: alt text stating what the screenshot proves>](<FILL: docs/screenshots/screen-a.webp>) | ![<FILL: alt text stating what the screenshot proves>](<FILL: docs/screenshots/screen-b.webp>) |

<!-- <OPTIONAL: include when one key surface needs a full-width screenshot> -->
![<FILL: alt text stating what the screenshot proves>](<FILL: docs/screenshots/screen-main.webp>)

## Key capabilities

- **<FILL: capability name>:** <FILL: concise description of user-facing value>
- **<FILL: capability name>:** <FILL: concise description of user-facing value>
- **<FILL: capability name>:** <FILL: concise description of user-facing value>

<!-- <OPTIONAL: include with 3–5 verified decisions that show judgment> -->
## Engineering highlights

- **<FILL: architectural decision>.** <FILL: why it matters and what trade-off was evaluated>
- **<FILL: engineering decision>.** <FILL: why it matters and what trade-off was evaluated>

<!-- <OPTIONAL: include when a short topology summary helps the reader> -->
## Architecture

```text
<FILL: high-level component flow>
```

<FILL: 1-2 sentences clarifying boundaries and runtime isolation>

<!-- <OPTIONAL: include when the stack has meaningful components to surface> -->
## Technology stack

- **<FILL: Category>:** <FILL: key technologies and libraries>
- **<FILL: Category>:** <FILL: key technologies and libraries>

<!-- <OPTIONAL: include when top-level layout is informative> -->
## Repository structure

| Path | Responsibility |
| --- | --- |
| `<FILL: path/>` | <FILL: responsibility> |

## Local development

Prerequisites: <FILL: runtime requirements, e.g. Node 24+, Docker>.

```bash
<FILL: setup, install, and run commands>
```

<FILL: local URLs or port information>

<!-- <OPTIONAL: include when the project has automated verification commands> -->
## Quality

```bash
<FILL: the Verify command from AGENTS.md>
```

<FILL: one sentence on what Verify and the CI Gate check>

<!-- <OPTIONAL: include when other documents exist; list only those> -->
## Documentation

- [<FILL: Document Name>](<FILL: relative path>) — <FILL: one-line purpose>.

<!-- <OPTIONAL: include when the repository has a LICENSE file> -->
## License

[<FILL: license name, e.g. MIT>](LICENSE)
