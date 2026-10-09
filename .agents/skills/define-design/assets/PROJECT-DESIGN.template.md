---
status: template
---

<!-- TEMPLATE — PROJECT-DESIGN.md
Written by define-design. Set status: approved only after the user approves the design preview screenshots.
Remove this comment when materializing the document.
-->

# Project Design

## Brief

- Product: <FILL: what it does and which surfaces matter most>
- Audience and context: <FILL: users, devices, environment, and frequency>
- Expression: <FILL: one craft tier and why it fits>
- Density: <FILL: one craft tier and why it fits>
- Must feel: <FILL: exactly three traits>
- Must not feel: <FILL: exactly three traits>
- Signature move: <FILL: one buildable move with exact values or classes>
- Color schemes: <FILL: light, dark, or both; default and whether users can switch>

## References

OPTIONAL — omit this section when there are no references.

| Reference (image, URL, or code path) | Take | Avoid |
| --- | --- | --- |
| <FILL: reference> | <FILL: one thing> | <FILL: one thing> |

## Voice

Language selects copy; locale formats dates, numbers, and currency; register sets tone, pronouns, and regionalisms. Never infer register, pronouns, slang, or regional voice from locale.

- Language and BCP 47 locale: <FILL: decide each explicitly>
- Register: <FILL: tone and pronouns>
- Regional voice: <FILL: explicit regionalisms or neutral wording>
- Terminology: <FILL: canonical product terms and words to avoid>
- Microcopy: <FILL: action labels, errors, and empty-state wording examples>

## Visual rules

- Typography roles: <FILL: role-to-font mapping and scale classes>
- Accent usage: <FILL: named tokens, allowed elements, and limits>
- Shape character: <FILL: radius values or classes by role>
- Depth: <FILL: shadow tokens or classes and where each applies>
- Motion character: <FILL: durations, easing, and permitted properties>
- Icon family and stroke: <FILL: family, stroke width, and size classes>
- Imagery: <FILL: image treatment, aspect ratios, and applicable surfaces>

## Product anti-patterns

OPTIONAL — <FILL: product-specific visual choices to reject, or omit this section>

## Token registry

Implemented in: <FILL: exact token file path>

Change this registry and that file in the same commit. When they disagree, this registry wins and the code is corrected.

```css
:root {
  --radius: <FILL: length in rem or px>;
  --background: <FILL: oklch()>;
  --foreground: <FILL: oklch()>;
  --card: <FILL: oklch()>;
  --card-foreground: <FILL: oklch()>;
  --popover: <FILL: oklch()>;
  --popover-foreground: <FILL: oklch()>;
  --primary: <FILL: oklch()>;
  --primary-foreground: <FILL: oklch()>;
  --secondary: <FILL: oklch()>;
  --secondary-foreground: <FILL: oklch()>;
  --muted: <FILL: oklch()>;
  --muted-foreground: <FILL: oklch()>;
  --accent: <FILL: oklch()>;
  --accent-foreground: <FILL: oklch()>;
  --destructive: <FILL: oklch()>;
  --success: <FILL: oklch()>;
  --success-foreground: <FILL: oklch()>;
  --warning: <FILL: oklch()>;
  --warning-foreground: <FILL: oklch()>;
  --info: <FILL: oklch()>;
  --info-foreground: <FILL: oklch()>;
  --border: <FILL: oklch()>;
  --input: <FILL: oklch()>;
  --ring: <FILL: oklch()>;
  --shadow-xs: <FILL: CSS box-shadow value>;
  --shadow-sm: <FILL: CSS box-shadow value>;
  --shadow-lg: <FILL: CSS box-shadow value>;
}
```

OPTIONAL — include `.dark` only when dark mode is selected; specify every changed color pair and shadow explicitly.

```css
.dark {
  /* <FILL: explicit overrides of the named root tokens, with full oklch() colors> */
}
```

| Role | Size / line height | Weight | Tracking | Class |
| --- | --- | --- | --- | --- |
| <FILL: one row per display, heading, body, and label role> | <FILL: size / line height> | <FILL: weight> | <FILL: tracking> | <FILL: class> |

| Font role | Family and fallback | Weights | Token / class |
| --- | --- | --- | --- |
| UI | <FILL: family and fallback> | <FILL: weights> | <FILL: --font-ui / class> |
| Heading | <FILL: family and fallback> | <FILL: weights> | <FILL: --font-heading / class> |

## Breakpoints and layout modes

Default to Tailwind `md` at 768px and `lg` at 1024px; record any deliberate overrides here and in code.

| Mode | Width | Layout |
| --- | --- | --- |
| Compact | < 768px | <FILL: navigation, columns, and container> |
| Medium | 768px to < 1024px | <FILL: navigation, columns, and container> |
| Wide | >= 1024px | <FILL: navigation, columns, and max-width> |
