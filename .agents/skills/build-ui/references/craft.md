# Craft defaults

Use these defaults unless approved product decisions specify other values; accessibility minimums always apply. Register chosen values in the token file, then use tokens in components.

## Accessibility minimums

- Text contrast is at least 4.5:1; large text (24px regular or 18.66px bold) and meaningful UI/graphics reach 3:1 against adjacent surfaces.
- Focus uses a 2px ring with a 2px offset on `--ring`; check contrast on each scheme and ensure sticky content never obscures focus.
- Pointer targets are at least 24x24 CSS px; use 44-48px for touch controls and check adjacent controls do not overlap.
- Never communicate status, error, or selection with color alone; add text, an icon, or a visible marker.
- Prefer semantic headings, labels, links, buttons, tables, and lists before ARIA; every control has an accessible name and logical keyboard order.
- Dialogs have an accessible name, focus entry into the modal, focus containment while open, Escape or a visible dismiss control, and focus return to the trigger.
- Reduced motion removes translation, scale, and animated scrolling; use immediate state changes or opacity-only feedback without depending on animation for meaning.

## Expression and density

- E0 Neutral Workspace: operational/backoffice UI; neutrals dominate, with accent limited to actions, focus, and selection.
- E1 Branded Product: SaaS and portals; one brand accent plus distinctive tokenized typography and selected/focus states.
- E2 Product Marketing: public product surfaces; display type at 40-72px, a dominant real product visual, and asymmetric or editorial composition.
- E3 Brand World: consumer, lifestyle, food, and editorial surfaces; brand imagery and expressive typography lead, while the one-accent-per-view and accessibility checks still pass.
- D0 Marketing: 96-128px desktop section rhythm and 64px mobile; prioritize one message per section.
- D1 Light SaaS: low-frequency settings/onboarding; 16px body and 24px surface padding.
- D2 Standard Workspace: administrative baseline; 16px body, 16px surface padding, grouped sections.
- D3 Operational: tables, schedules, and inventory; 14px body, 12-16px padding, planar rows instead of decorative cards.
- D4 Expert Dense: trading/dispatch/editor workflows only when density accelerates expert decisions; 14px body, compact grids, and keyboard access to frequent actions.

| Context | Expression | Density | Geometry / imagery / motion checks |
| --- | --- | --- | --- |
| Marketing | E2 | D0 | 16-28px surfaces, art-directed real imagery, one focal visual per section |
| SaaS workspace | E1 | D2 | 8-14px cards, real workflow states, micro feedback within 180ms |
| Operational tool | E0 | D3 | 0-4px tables, imagery only when operationally relevant, keyboard-first controls |
| Editorial | E2-E3 | D1-D2 | Sharp or art-directed geometry, editorial images with a defined reading order |
| E-commerce / marketplace | E1-E2 | D2 | Product-object cards, genuine product imagery, hover lift only in D0-D2 |
| Healthcare / clinical | E0-E1 | D2-D3 | Restrained surfaces, clinical context only, no bounce or decorative motion |

## Hierarchy and visual budgets

- Name the first, second, and third reading targets before markup; each must differ in size, weight, position, or spacing.
- Keep one primary focus per region and one dominant action per decision area; two equal filled CTAs fail the check.
- One accent hue dominates the view; keep semantic colors localized to actual statuses and errors.
- Before adding a card, test spacing, alignment, divider, column, heading, or muted surface; add containment only for a real object, choice, or independent module.
- Reject nested cards used only to separate attributes; compare the view with card borders removed and confirm hierarchy survives.
- Remove accent mentally: reading order and primary action must remain clear through type, spacing, and contrast.

## Typography

- Body is 16px in D0-D2 and 14px in D3-D4; do not shrink body text to fit Compact.
- Labels are 12-14px; every label still passes text contrast and remains distinct from placeholder text.
- Section titles are 18-20px semibold; page titles are 24-32px.
- Display is 40-72px with tracking -0.02 to -0.03em and line height 1.05-1.15; reflow display text before reducing below 40px.
- Body line height is 1.5-1.6 and prose measure is 60-75ch; keep prose within its layout container.
- Use `tabular-nums` for comparable numbers, sentence case for UI labels, and `text-wrap: balance` on headings.
- Use at most two font families; assign each a named role in PROJECT-DESIGN rather than mixing families within one role.

## Spacing and layout

- Use a 4px base spacing scale; distances come from registered tokens or matching scale utilities.
- Gutters are 24-32px desktop and 16px mobile; align headers, sections, and footers to the same grid edge.
- Card padding is 12-16px for dense UI and 24-32px for marketing; equal-role surfaces share padding.
- Marketing sections use 96-128px vertical spacing desktop and 64px mobile; any exception must have a documented content reason.
- Marketing containers are 1152-1200px, prose is capped at 680px, and app content at 1440px; retain mobile gutters below those maxima.

## Color

- Begin with neutral canvas, surfaces, and readable text; add one accent hue per view after hierarchy passes the Neutral test.
- Keep success, warning, error, and info separate from the accent and pair each with text or a symbol.
- In dark mode, deeper surfaces are lighter than the canvas; check every foreground pair instead of inverting the light palette.
- Use approved scheme settings; choosing dark by default without a product decision is a Major finding.

## Geometry and depth

- Radius defaults: tables 0-4px, controls 6-10px, cards 8-14px, dialogs 12-18px, marketing surfaces 16-28px.
- Enforce `controls <= cards < dialogs` within the product's registered radius scale.
- Pills are reserved for status, filters, and chips; standard buttons and every container must not become pills.
- Static surfaces use a border and no shadow; controls use a border plus a token for `0 1px 2px rgb(0 0 0 / 0.05)`.
- Reserve floating elevation for real menus, popovers, sheets, tooltips, and dialogs; reject stacked shadows on static nested surfaces.

## Motion

- Durations: 120-180ms micro feedback, 180-240ms overlays, 240-320ms panels; app UI never exceeds 350ms.
- Enter easing is `cubic-bezier(0.16, 1, 0.3, 1)`; use no bounce or overshooting spring.
- Press feedback uses `scale(0.98)` and leaves the hit target fixed.
- Hover lift uses `translateY(-1px)` only for clickable cards in D0-D2; dense rows and static cards never lift.
- Reduced-motion mode keeps the same state information with opacity or immediate feedback.

## Responsive

- Validate Compact at 390px, Medium at 768px, and Wide at 1440px; default layout breakpoints are 768px and 1024px unless the registry says otherwise.
- Preserve essential meaning and the primary action; keep their reading order when the layout changes.
- Reflow columns into a single reading sequence; marketing stacks copy, CTA/proof, then media.
- Collapse secondary navigation into a menu/sheet; keep its trigger reachable by keyboard and touch.
- Replace tables with priority lists or expandable records, drawers with full-height sheets, and filter toolbars with a focused filter sheet.
- Hide only truly secondary content; never hide required actions, error text, or the only access to record detail.
- At 390px there is no horizontal scroll or clipped content; use `min-width: 0` and wrapping where flex/grid children overflow.
- Keep forms/settings in one column on Compact, use correct input keyboards, and retain 44-48px touch targets.

## Generic-output tells

Each tell is a Major finding; remove it or demonstrate the concrete product decision and evidence that justify it.

- Blue-purple gradient without a brand reason.
- Gradient text used as generic emphasis.
- Emoji substituted for the product's icon family.
- A default row of three icon cards without three meaningful independent objects.
- Everything centered instead of a ranked reading order.
- Nested cards that provide no semantic containment.
- Pills everywhere instead of role-based geometry.
- Glassmorphism that replaces hierarchy or weakens legibility.
- Gray-on-gray text with weak hierarchy; below-minimum contrast is Blocking.
- Invented KPIs, logos, testimonials, or AI assistants; fabricated content is also Blocking.
- Decorative blobs or stock filler with no product purpose.
- Dark mode by default without an approved product reason.
- One weight and size for all text roles.
