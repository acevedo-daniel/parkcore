<!--
TEMPLATE — ARCHITECTURE.md
Place: /docs/ARCHITECTURE.md
When: the project has meaningful component boundaries, data flow, or technical invariants.
Rules:
- Describe the architecture that exists, not aspirational patterns.
- Do not document every class or file.
- Diagrams may use mermaid (GitHub renders it) or text fences.
- Delete sections that do not apply.
- Remove this comment before use.
-->

# <FILL: Project Name> — Architecture

> Components, boundaries, data flow, invariants, and trade-offs.

## Summary

<FILL: concise description of system shape, primary responsibility, and boundaries>

<!-- <OPTIONAL: include when visual flow clarifies structure> -->
```text
<FILL: high-level component or data flow topology>
```

<!-- <OPTIONAL: include when there are meaningful modules or subsystems> -->
## Component boundaries

| Component | Owns | Boundary |
| --- | --- | --- |
| `<FILL: module/area>` | <FILL: core responsibility> | <FILL: what it must not own> |

<!-- <OPTIONAL: include when storage architecture requires documentation> -->
## Data and persistence

<FILL: data ownership, store roles, migration model, consistency rules>

<!-- <OPTIONAL: include when cloud or deployment structure clarifies boundaries> -->
## Hosted topology

<FILL: concise hosted component boundaries and communication channels>

<!-- <OPTIONAL: include when system has non-negotiable technical constraints> -->
## Invariants

- **<FILL: invariant name>:** <FILL: condition that must remain true across all operations>

## Trade-offs

### <FILL: architectural trade-off title>

<FILL: what was chosen, why it is acceptable, and its operational cost or limitation>

## Related documentation

<!-- List only documents that actually exist. -->
- [<FILL: Document Name>](<FILL: relative path>)
