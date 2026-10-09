# Visual review

Inspect every changed route at 390, 768, and 1440px in every supported scheme, and inspect the closest supplied reference beside it. A screenshot cannot prove keyboard behavior or computed contrast: confirm those in the running app or token pairs.

## Findings

| # | Screenshot | Severity | Finding | Fix |
| --- | --- | --- | --- | --- |
| 1 | Screenshot path and viewport/scheme | Blocking, Major, or Polish | Concrete observed failure and location | Specific correction |

Use one row per finding; identify the control/region and the value or condition it violates. Return no invented findings when the capture passes.

## Blocking

- Horizontal scroll or clipped content, especially at 390px.
- Text/UI contrast below craft's minimums; confirm actual token pairs or computed colors.
- A reachable UI-SPEC state is missing; capture each listed state rather than inferring it from a happy path.
- Placeholder or invented content, including metrics, features, customer logos, or testimonials.
- A broken image or unloaded/wrong font; verify network/font readiness before capturing again.

## Major

- No single primary action, or competing focal points within one decision region.
- Off-token colors, radii, shadows, fonts, or type sizes; inspect the affected component source.
- Inconsistent section spacing or equal-role padding without a documented content reason.
- Any generic-output tell in craft, including gradient text, arbitrary card grids, or pills everywhere.
- Compact is a scaled-down Wide layout instead of reflowed/substituted controls.
- Dark appears inverted instead of using readable foregrounds and lighter depth surfaces.

Compare each capture with the closest supplied reference and record the most specific gap - spacing rhythm, type contrast, density, depth, or imagery - at the severity its effect deserves. When the capture matches the reference, record no gap. Without a reference, compare against craft. Never invent a reference or a gap.

## Polish

- Grid edges or equal-role spacing are misaligned.
- Icons lack optical alignment or vary in stroke width at the same role.
- Heading widows, unbalanced wrapping, or prose exceeding 75ch weaken reading.
- Image crops cut useful product content or distort the image's proportions.

## Four review tests

- Neutral: mentally remove accent color. Can type, position, and spacing still identify reading order and the primary action?
- Card: mentally remove card borders. Do objects and sections remain grouped without nested decorative boxes?
- Zoom: view the 390px capture at reduced scale. Can you identify page purpose, major regions, and the primary CTA before reading details?
- Realism: check that data, actions, roles, statuses, dates, and charts agree with the same credible product scenario across views.

## Fix and capture again

Fix Blocking and Major findings, then recapture affected routes, states, widths, and schemes. Open the new captures; never infer a visual pass from compilation or tests alone.

After three rounds, report remaining findings and their severity. Blocking or Major findings mean visual review is incomplete; keep screenshot evidence and explain the unresolved cause. Report Polish findings explicitly rather than silently expanding scope.
