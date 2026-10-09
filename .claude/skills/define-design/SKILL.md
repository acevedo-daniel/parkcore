---
name: define-design
description: Use when starting a product's visual design, creating or revising design/PROJECT-DESIGN.md, design/UI-SPEC.md, or design tokens, choosing a visual direction or style for a website or app, or when UI work starts in a project without design/PROJECT-DESIGN.md. Turns the user's references and product facts into tokens in code, a design preview page, and screenshots the user approves.
---

# Define Design

Use this skill once per product, and again when its visual direction changes.

## Core contract

- The user approves what they see, not prose. The outcome is tokens in code, a design preview page, and its screenshots.
- Ask for facts and taste; decide the craft. Never invent the audience, brand assets, or product scope.
- Keep `design/PROJECT-DESIGN.md` short and concrete. Every rule in it must be checkable in a screenshot or in the code.
- Product language, locale, and writing register are separate decisions; never infer register, pronouns, or regional style from a locale.

## Gather

Ask in one message and wait for the answers:

1. What the product is, who uses it, on which devices, and how often.
2. Which surfaces matter most: public marketing pages, the app workspace, or both.
3. Optional references it should feel like: screenshots for direction (saved as `design/references/NN-<name>.png`), and URLs or code of sections to reproduce for execution. Each gets one thing to take and one to avoid.
4. Existing brand assets: logo, colors, and fonts.
5. Light, dark, or both, and whether users can switch.

When the user has no references, propose three directions in one sentence each, named after their closest real product, and let the user choose before continuing.

## Decide

Fill `design/PROJECT-DESIGN.md` from [the template](assets/PROJECT-DESIGN.template.md):

- choose one Expression tier and one Density tier from [craft](../build-ui/references/craft.md) › Expression and density;
- derive every token value and check each text and background pair against the contrast minimums in craft;
- name one signature move concrete enough to build, such as "section titles in the display face at 64px with -0.03em tracking", not "bold typography".

Write `design/UI-SPEC.md` from [its template](assets/UI-SPEC.template.md) only when the product has more than one view whose content order or states are not obvious.

## Build the preview

1. Set up the primitive layer. For React projects without `components.json`, ask, then initialize shadcn/ui and add the base set listed in build-ui's stack reference. Add its lint rule against raw interactive elements outside `components/ui/`.
2. Implement the tokens in the file the registry names, following the matching stack reference in [build-ui](../build-ui/SKILL.md) › Stack references.
3. Add a design preview page that is unavailable in production, for example a Next.js `src/app/design-preview/page.tsx` that calls `notFound()` when `process.env.NODE_ENV === "production"`.
4. Render it with the project's real components: the type scale, every color token as a labeled swatch, buttons in each variant and state, inputs including an error, a card, three table rows, status badges, an empty state, and one page header or hero that uses the signature move.
5. Run the build-ui visual review loop on the preview page.

## Approve

Show the user the final screenshots and the PROJECT-DESIGN diff. Set `status: approved` in PROJECT-DESIGN, and in UI-SPEC when it was written, only after the user accepts them. To change direction later, edit PROJECT-DESIGN and the token file together and capture the preview again.
