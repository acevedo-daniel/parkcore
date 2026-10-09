---
name: build-ui
description: Use when building, restyling, or polishing user interface, such as pages, views, landing sections, dashboards, forms, or components; when the user asks to make UI look better, more premium, or more modern; or when the user asks to review a page's visual quality. Applies the project's design decisions with concrete craft defaults and proves the result with a screenshot review loop.
---

# Build UI

Use this skill for any change a user can see.

## Core contract

- Before writing UI, read `design/PROJECT-DESIGN.md`, the view's section in `design/UI-SPEC.md` when it exists, and the references PROJECT-DESIGN lists: images for direction, code or URLs for execution.
- When `design/PROJECT-DESIGN.md` is missing, use the `define-design` skill first. For a small fix, apply the defaults in [craft](references/craft.md) and say so in the report.
- Use token values only. Colors, radii, shadows, fonts, and type sizes come from the token file named in PROJECT-DESIGN › Token registry. Components contain no raw hex, rgb, or oklch values and no arbitrary Tailwind values such as `bg-[#1a1a1a]` or `text-[13px]`.
- Keep three layers: primitives in `components/ui/`, product components that compose them, and pages that compose only those two. Never write a raw `button`, `input`, `select`, `textarea`, or `dialog` outside `components/ui/`; add the missing primitive instead.
- Extend a primitive with a variant instead of restyling it at the call site.
- Use real or coherent demo content. Never ship lorem ipsum, invented metrics, testimonials, customer logos, or features the product does not have.
- The work is done when the screenshots pass review, not when the code compiles.

## Precedence

When sources disagree, follow the user's request, then UI-SPEC, then PROJECT-DESIGN, then the references, then [craft](references/craft.md). The accessibility minimums in craft are never overridden.

## Build

1. State the view's purpose and its one primary action.
2. Rank its content before writing markup: what the eye must reach first, second, and third.
3. Build the Wide layout, then adapt Medium and Compact with [craft](references/craft.md) › Responsive.
4. Implement every state UI-SPEC lists for the view. Without a UI-SPEC, implement loading, empty, and error for each data request the view makes.
5. Read [patterns](references/patterns.md) for the section or component you are building, and the stack reference that matches the project.

## Visual review loop

Run this loop for every visible change before reporting it done.

1. Start the app with the project's Dev command and wait until the route responds. Create `local-docs/tmp/ui-review/<view>/`.
2. Capture each changed route at three widths in every color scheme the product supports:

   ```bash
   pnpm exec playwright screenshot --full-page --viewport-size=390,844 --color-scheme=light <url> local-docs/tmp/ui-review/<view>/390-light.png
   ```

   Repeat with `768,1024` and `1440,900`, and with `--color-scheme=dark` when the product supports dark. Use the project's package runner when it is not pnpm. When the scheme is set by an in-app toggle instead of the system preference, capture through the project's E2E setup. If Playwright browsers are missing, ask before installing them.
3. Open every screenshot and the closest reference. Review them with [review](references/review.md) and list findings by severity.
4. Fix Blocking and Major findings, then capture again.
5. Stop after three rounds and report what remains, with its severity.

Never report a visual result you did not capture and look at.

## Review mode

When the user asks to review or audit a page without changing it, run steps 1-3 of the loop, return the findings table from [review](references/review.md), and change nothing.

## Stack references

Read only the reference that matches the project:

- [shadcn/ui and Tailwind CSS v4](references/shadcn-tailwind.md): token mapping, theming, variants, and fonts.

For another stack, apply the same contract with its own theming mechanism.

## Report

Return what changed, the screenshot paths reviewed, the findings fixed, and any finding left open with its severity.
