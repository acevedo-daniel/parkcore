# UI patterns

Use only the recipe that fits the view; every interactive element is a primitive or a product component composing primitives. Apply the values in [craft](craft.md).

## App shell

- Order sidebar content as brand/workspace, optional search, primary navigation, secondary groups, then settings/support/profile.
- Keep the topbar to global workspace, search, create, notifications, or account; do not duplicate page actions there.
- Give the active destination one readable selected surface and `aria-current`; icon-only navigation needs names.
- Replace deep navigation with a menu/sheet on Compact; a bottom bar fits only 3-5 frequent destinations.

## Page header

- Put optional real-hierarchy breadcrumbs before the page title, then a concise description if needed.
- Place view controls and secondary actions below or alongside the identity; give one primary action visual dominance.
- Use muted ancestors and a strong current breadcrumb; collapse genuinely deep paths.
- On Compact, wrap actions without squeezing the title or hiding the primary action.

## Data table

- Use a table when comparing columns matters; integrate it into the page with muted headers and stronger data.
- Right-align comparable numeric values with `tabular-nums`; align text and action columns consistently.
- Show status with a label plus dot, icon, or restrained badge; selection uses a subtle row surface.
- Keep sorting, selection, pagination, and row actions keyboard accessible and named.
- Implement loading, empty, no-results, and error separately; preserve filter state during recovery.
- On Compact, replace with priority lists/expandable records and a route to full detail.

## Form

- Order each field as visible label, control, then helper/error; placeholders never replace labels.
- Size by meaning: dates/codes compact, email longer, descriptions full width.
- Use 1-2 columns on Wide and one on Compact unless an approved expert workflow requires more.
- Associate local errors with their controls, retain entered values, and provide a concrete recovery action.
- Pending submit prevents duplicate writes and names progress; disabled fields remain readable.

## System states

- Distinguish empty, no results, error, permission denied, required action, unavailable, and success when reachable.
- Use a clear title, one short explanation, one recovery/primary action, and optional secondary action.
- Structured loading uses skeletons matching final content; a small action uses an inline spinner.
- Field/section feedback stays inline; transient success may toast; persistent page concerns use a banner.
- Critical information must remain available after a toast disappears; preserve context on retry.

## Drawer, dialog, or page

- Use a drawer for inspection/light editing when the parent list context matters; retain the selected record.
- Use a dialog for a short blocking choice, focused creation, upload, or destructive confirmation.
- Use a page for long or primary workflows; do not nest complex forms inside repeated modals.
- Order a drawer as identity/status/actions, sections, related/history, and footer only when needed.
- On Compact, replace drawers with full-height sheets; implement the dialog focus rules in craft.

## Command palette

- Add a palette only when the product has enough searchable destinations/actions to justify it.
- Order search, optional type filters, grouped results, quick actions, and optional keyboard hints.
- Use rows with subtle keyboard selection; Escape closes and returns focus to the trigger.
- Explain no results and expose accessible names; do not hide essential workflows solely in the palette.

## Settings

- Use title, tabs or settings navigation, grouped fields, and dividers; avoid a card per option.
- Use switches only for direct binary settings; staged changes need a clear Save action.
- Separate destructive options and state their consequences before confirmation.
- On Compact, use grouped one-column rows with readable labels and touch targets.

## Authentication

- Keep a strong heading, minimal fields, visible labels, one primary action, and recovery access.
- Use social login only when supported; show pending, invalid-credential, and unavailable states.
- A Wide visual/form split must show real product/domain context rather than generic stock imagery.
- On Compact, prioritize the form and preserve keyboard/input behavior; never fabricate product proof.

## Marketing navbar

- Show logo, restrained destination links, and one primary CTA with room between groups.
- Use a mega-menu only for information architecture that needs grouped destinations.
- Collapse links into an accessible sheet/menu on Compact while keeping the primary action discoverable.
- Match the site's container edges and ensure sticky navigation never obscures anchors or keyboard focus.

## Hero

- State one product message and one supporting sentence; make the primary and secondary actions distinct.
- Use a real product screenshot, demo, or relevant art-directed image as the dominant visual.
- Prefer a split/asymmetric layout when copy and proof need separate reading roles; center only when the visual deserves central focus.
- Do not add invented stat strips, customer logos, or testimonial proof.
- On Compact, stack copy, CTA/proof, then media; keep the product visual large enough to explain the product.

## Section grammar

- Pick a section purpose: product proof, split feature, meaningful feature grid, pricing, genuine testimonial, CTA, or footer.
- Use one dominant visual idea per section; do not combine photo, illustration, bento, gradient, and multiple CTAs by default.
- Alternate composition only to support the narrative; there is no mandatory landing-page sequence.
- Keep section rhythm consistent with craft and use containers only for actual objects or comparisons.

## Feature sections

- Describe one real user capability with a concrete benefit and its supporting product visual.
- Use split sections for workflows; use grids only when each feature is meaningfully independent.
- A bento is appropriate only for modular content, with explicit priority between cells.
- Keep text tied to the adjacent screenshot/detail; remove unsupported features and decorative icon-card filler.

## Product proof

- Show real screenshots, demos, or meaningful visuals with coherent data and reachable states.
- Caption the workflow or outcome the image proves; technical stack badges are secondary.
- Preserve readable crops and intrinsic image proportions; show actual product controls rather than fake mockups.
- Use logos, customers, and testimonials only when provided and verified; omit unsupported social proof.

## Pricing

- Present genuine comparable plans with included capabilities, billing period, currency, and total cost clarity.
- Highlight one recommendation only when the product has a justified default; keep other options readable.
- Separate primary purchase/upgrade from secondary detail actions and expose important limitations before checkout.
- On Compact, stack plan comparisons with the selected plan and total near the primary action.

## CTA band

- Repeat one concrete next step supported by the product; use one dominant action.
- Keep supporting copy to one short sentence and omit invented urgency or guarantees.
- Distinguish this region with spacing, typography, or approved brand surface instead of stacking effects.
- Keep a secondary action only when it serves a different legitimate user intent.

## Footer

- Group real destinations by purpose and include only available legal, support, product, or account links.
- Keep brand information concise; do not repeat the full hero or a second navigation system.
- Show contact/social links only when supplied and valid; avoid fabricated certifications or trust badges.
- On Compact, retain readable group labels and touch targets rather than shrinking a Wide grid.

## Eight-point chart test

Every chart must identify:

1. The question it answers.
2. The metric and units.
3. The chart type appropriate to that metric.
4. The comparison or baseline.
5. The reason for each color.
6. Access to exact values.
7. The no-data state.
8. Mobile behavior.

Prefer a number or table if it answers the question more directly. Use one chart per Compact row and provide keyboard/touch-accessible exact values rather than hover alone.
