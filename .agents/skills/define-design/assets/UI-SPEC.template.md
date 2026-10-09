---
status: template
---

<!-- TEMPLATE — UI-SPEC.md
Written by define-design when multiple views need explicit content order or states.
Remove this comment when materializing the document.
-->

# UI Specification

This document owns view structure and behavior. Inherit visual decisions and Voice from PROJECT-DESIGN.md; specify only states the product can actually reach.

## Global interface rules

| Concern | Rule |
| --- | --- |
| Application shell | <FILL: persistent regions and boundaries> |
| Navigation | <FILL: hierarchy, active item, and route transitions> |
| Page container | <FILL: width and alignment> |
| Spacing | <FILL: section and content rhythm> |
| Repeated interactions | <FILL: shared action and confirmation behavior> |
| Feedback | <FILL: inline, toast, and persistent feedback placement> |

## System states

| State | Presentation and behavior |
| --- | --- |
| Default / populated | <FILL: normal content and available actions> |
| Loading | <FILL: pending content and interaction availability> |
| Empty | <FILL: explanation and next action> |
| Error | <FILL: message, preserved input, and recovery action> |
| Situational | <FILL: reachable success, permission, or other states; omit irrelevant states> |

## Route inventory

| Route | View | Access | Primary purpose | README screenshot |
| --- | --- | --- | --- | --- |
| <FILL: route> | <FILL: view> | <FILL: access> | <FILL: purpose> | <FILL: docs/screenshots/name.png, or None> |

The README screenshot column lists only views shown in README. When a listed view changes, regenerate its screenshot with the project's Screenshots command in the same change.

Beyond about eight views, split view details into `design/ui-spec/<view>.md` and link them from this document. Keep global rules, system states, and route inventory here.

## Views

Repeat this block per view, or link its detail file after splitting.

### View: <FILL: name>

- Route: <FILL: path and parameters>
- Purpose and success condition: <FILL: what the user accomplishes and observable success>
- Primary action: <FILL: action and destination or result>

#### Content order

<FILL: ordered regions and content; for marketing pages, list sections in reading order. Include necessary data and behavior.>

#### Wireframe

OPTIONAL — omit when content order is sufficient.

```text
<FILL: the view's actual hierarchy and placement>
```

#### Responsive exceptions

<FILL: only where this view departs from craft › Responsive, or None>

#### States

<FILL: reachable view states, how they differ from system defaults, and recovery actions>

#### Copy

| Element | Copy |
| --- | --- |
| Title | <FILL: title> |
| Primary action | <FILL: label> |
| Empty | <FILL: message and next action, or None> |
| Error | <FILL: message and recovery, or None> |
| Success | <FILL: confirmation, or None> |
