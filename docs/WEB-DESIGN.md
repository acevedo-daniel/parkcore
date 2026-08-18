# ParkCore Web Design

**Status:** Implemented — ParkCore 1.0
**Target:** ParkCore 1.0  
**Purpose:** Record the frontend direction implemented for ParkCore 1.0.

---

## 1. Product interpretation

ParkCore is an operational parking-management product with two surfaces:

1. **Public surface**
   - Discover active parking facilities.
   - Search/filter available parkings.
   - Inspect facility details, address, rate, capacity and status.
   - No reservations, payments, reviews or customer accounts.

2. **Owner surface**
   - Authenticate as an owner/operator.
   - Manage owned parking facilities.
   - Activate/deactivate a facility.
   - Start vehicle sessions through check-in.
   - Monitor active sessions and occupancy.
   - Complete or cancel sessions.
   - Inspect session history.
   - Manage the owner profile.

The frontend must make these two surfaces feel related, but not identical.

---

# 2. Design vision

## 2.1 Direction

**Industrial Monochrome / Urban Operations**

ParkCore should combine:

- editorial minimalism;
- urban infrastructure;
- parking/signage language;
- technical dashboards;
- high information density where useful;
- strong black/white contrast;
- restrained grayscale surfaces;
- very small amounts of semantic color.

The visual system should feel modern and premium, but not decorative.

### Desired feeling

Public:

> architectural, calm, urban, clear.

Owner:

> operational, concentrated, precise, fast.

### Avoid

ParkCore must not look like:

- a stock shadcn dashboard;
- a generic SaaS admin;
- a Vercel clone;
- a fintech dashboard;
- a crypto interface;
- a glassmorphism experiment;
- a cyberpunk console;
- a card wall;
- a fake analytics product.

---

# 3. Core design principles

## 3.1 Information before decoration

Operational data is the visual language.

Important visual elements are:

- plate numbers;
- occupancy;
- capacity;
- rate;
- elapsed time;
- session status;
- parking identity;
- time of check-in;
- total amount.

The UI should not need decorative graphics to feel designed.

## 3.2 Grids and rows before cards

Prefer:

- structural grids;
- separators;
- rows;
- tables;
- flat panels;
- typographic hierarchy.

Avoid filling every section with independent rounded cards.

## 3.3 Monochrome with semantic exceptions

The brand remains grayscale.

Color is reserved for meaning:

- green → healthy/active/success;
- amber → warning/high occupancy;
- red → destructive/error/cancelled.

Status must still be understandable without color.

## 3.4 Fast operational interaction

The owner experience should optimize:

- check-in speed;
- finding active vehicles;
- understanding occupancy;
- checkout clarity;
- mobile operation.

Animations must never slow these tasks.

## 3.5 Explicit states

Every screen/component must consider:

- loading;
- empty;
- success;
- error;
- offline/network failure;
- disabled;
- pending action;
- destructive confirmation.

---

# 4. Product surfaces

## 4.1 Public surface

Theme:

- off-white canvas;
- pure/near-pure black text;
- gray secondary information;
- generous whitespace;
- architectural/editorial proportions.

Primary goals:

- understand what ParkCore is;
- find a parking;
- inspect a parking;
- access owner authentication.

## 4.2 Owner surface

Theme:

- matte near-black canvas;
- subtle dark surface hierarchy;
- white text;
- muted grays;
- thin separators;
- dense operational content.

Primary goals:

- understand current facility state immediately;
- start sessions;
- finish sessions;
- manage facilities;
- inspect history.

This is not "light mode vs dark mode."

They are two intentional product contexts.

---

# 5. Information architecture

## 5.1 Public

```text
/
├── /parkings
├── /parkings/:parkingId
├── /login
└── /register
```

## 5.2 Owner

```text
/app
├── /app/parkings
├── /app/parkings/new
├── /app/parkings/:parkingId
├── /app/parkings/:parkingId/edit
├── /app/parkings/:parkingId/sessions
├── /app/sessions/:sessionId
└── /app/profile
```

### `/app`

Acts as the owner overview.

A dedicated `/app/dashboard` route is unnecessary unless later requirements justify it.

---

# 6. Main user journeys

## 6.1 Public discovery

```text
Home
→ Parking catalog
→ Search/filter
→ Parking detail
```

## 6.2 New owner

```text
Home
→ Register
→ Owner overview
→ Create parking
→ Parking overview
```

## 6.3 Daily check-in

```text
Owner overview
→ Parking
→ Check in
→ Enter plate
→ Enter/reuse vehicle data
→ Optional visitor information
→ Start ACTIVE session
```

## 6.4 Checkout

```text
Parking overview
→ Active session
→ Session detail / checkout
→ Review duration and calculated amount
→ Complete checkout
→ COMPLETED
```

## 6.5 Cancel

```text
Active session
→ Cancel
→ Confirm destructive operation
→ CANCELLED
```

---

# 7. Screen inventory

## Public

1. Landing
2. Parking catalog
3. Parking detail
4. Login
5. Register
6. Public 404

## Owner

7. Owner overview
8. Parking list
9. Create parking
10. Parking overview
11. Edit parking
12. Active sessions
13. Check-in
14. Session detail
15. Checkout confirmation
16. Cancel confirmation
17. Session history
18. Profile
19. Auth/session error state
20. Owner 404

Some of these may be dialogs/sheets instead of standalone routes.

---

# 8. Visual identity

## 8.1 Naming language

Brand:

```text
PARKCORE
```

Facility identity may use a signage-like identifier:

```text
P / 01
P / 02
P / 03
```

This is visual identification only. It must not imply physical parking-slot modeling.

---

# 9. Color system

## 9.1 Public / light

```text
--public-canvas:          #F7F7F5
--public-surface:         #FFFFFF
--public-fg:              #0A0A0A
--public-fg-secondary:    #5F5F5F
--public-fg-muted:        #8A8A8A
--public-border:          #DEDEDB
--public-border-strong:   #B8B8B3
```

## 9.2 Owner / dark

```text
--owner-canvas:           #080808
--owner-surface:          #0D0D0D
--owner-surface-raised:   #121212
--owner-surface-hover:    #181818

--owner-fg:               #F2F2F2
--owner-fg-secondary:     #A3A3A3
--owner-fg-muted:         #6C6C6C

--owner-border:           #242424
--owner-border-strong:    #3A3A3A
```

## 9.3 Semantic

Semantic colors must be restrained.

```text
--success
--warning
--danger
```

Recommended meaning:

```text
ACTIVE / AVAILABLE        green
HIGH OCCUPANCY            amber
CANCELLED / ERROR         red
```

Do not convert whole panels to saturated colors.

---

# 10. Typography

Use two complementary families.

## 10.1 Sans

Used for:

- navigation;
- page headings;
- body text;
- controls;
- forms;
- buttons.

Desired character:

- neutral;
- modern grotesk;
- clean at small sizes;
- not overtly futuristic.

## 10.2 Mono

Used selectively for:

- license plates;
- times;
- money;
- coordinates;
- occupancy values;
- technical IDs;
- operational labels.

Examples:

```text
AB 123 CD
42 / 64
01:43
ARS 2.400
P / 01
```

Do not use mono for long body copy.

---

# 11. Typography scale

Approximate scale:

```text
Hero               64–80px desktop
Page title          36–48px
Section title       20–24px
Body                14–16px
Small               13px
Technical label     11–12px
Large metric        40–64px
```

Technical labels may use uppercase + letter spacing:

```text
ACTIVE SESSIONS
HOURLY RATE
CAPACITY
```

Avoid using uppercase for all interface text.

---

# 12. Spacing

Base scale:

```text
4
8
12
16
24
32
48
64
96
```

Suggested tokens:

```text
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px
--space-24: 96px
```

Public pages use more whitespace.

Owner pages use tighter, operational spacing.

---

# 13. Radius, borders and shadow

## Radius

```text
small     4px
medium    6px
large     8px
```

Avoid large radii as a default.

## Borders

Thin borders are a major structural tool.

```text
1px solid var(--border)
```

Use separators aggressively but subtly.

## Shadows

Use very sparingly.

Appropriate:

- dialogs;
- floating menu;
- temporary overlays.

Avoid card shadows as standard hierarchy.

---

# 14. Layout system

## 14.1 Public

Suggested maximum width:

```text
1280–1440px
```

Large horizontal breathing room.

## 14.2 Owner

Suggested content width:

```text
up to ~1600px
```

Use the screen efficiently.

Desktop shell:

```text
┌─────────────┬───────────────────────────────────────────┐
│ Sidebar     │ Main                                      │
│ 220–240px   │                                           │
└─────────────┴───────────────────────────────────────────┘
```

---

# 15. Navigation

## 15.1 Public desktop

```text
PARKCORE             PARKINGS             SIGN IN   GET STARTED
```

Keep navigation intentionally small.

Do not invent marketing navigation such as:

- Features;
- Solutions;
- Customers;
- Resources;
- Blog;
- Pricing.

## 15.2 Public mobile

```text
PARKCORE                                          MENU
```

## 15.3 Owner desktop

Text-first navigation:

```text
PARKCORE

Overview
Parkings

────────────

Daniel
Profile
Sign out
```

Icons may support text, not replace it.

## 15.4 Owner mobile

No persistent desktop sidebar.

Preferred pattern:

```text
Top context bar
+
content
+
compact bottom navigation
```

Primary areas:

```text
Overview
Parkings
Profile
```

Facility actions live inside facility context.

---

# 16. Domain component language

These components give ParkCore its identity.

## 16.1 Plate

Purpose:

Display the most recognizable vehicle identity.

Visual:

- monospace;
- slight tracking;
- rectangular border;
- small radius;
- high contrast.

Example:

```text
┌────────────┐
│ AB 123 CD  │
└────────────┘
```

Do not make it photorealistic.

## 16.2 OccupancyMeter

Avoid donut charts.

Preferred:

```text
42 / 64

████████████████████████░░░░░░░░
```

or discrete blocks:

```text
■■■■■■■■■■■■■■■■■■■■□□□
```

Threshold behavior:

```text
0–69%       neutral
70–89%      warning indicator
90–100%     critical indicator
```

The meter remains mostly monochrome.

## 16.3 ParkingIdentity

Example:

```text
P / 01
CENTRAL
Av. Corrientes 1842
```

## 16.4 SessionRow

Example:

```text
AB 123 CD     CAR        01:43        ACTIVE       →
```

## 16.5 RateDisplay

Example:

```text
ARS 2.400
PER HOUR
```

## 16.6 Metric

Example:

```text
42 / 64
OCCUPIED
```

## 16.7 Status

Always text + optional semantic marker.

```text
● ACTIVE
● COMPLETED
● CANCELLED
```

Never color alone.

---

# 17. Primitive component set

Only implement primitives actually needed.

Expected set:

- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox/Switch
- Dialog
- Sheet
- DropdownMenu
- Tooltip
- Tabs
- Toast
- Skeleton
- EmptyState

Do not build a massive UI kit before product screens exist.

---

# 18. Buttons

## Primary

Light:

```text
black background
white text
```

Dark:

```text
white background
black text
```

## Secondary

Transparent background + border.

## Destructive

Prefer:

- red text;
- red border;
- restrained background.

Large saturated red buttons only when destructive emphasis is required.

---

# 19. Inputs

Height:

```text
~44–48px
```

Structure:

```text
LABEL

[ Input value                  ]

helper / validation
```

Properties:

- explicit visible label;
- small radius;
- border-based hierarchy;
- visible focus ring;
- no placeholder-only forms.

---

# 20. Landing page

## Purpose

Introduce both product surfaces without fake SaaS marketing.

## Hero

Suggested structure:

```text
┌────────────────────────────────────────────────────────────┐
│ PARKCORE                                                   │
│                                                            │
│ Parking,                                                   │
│ under control.                                             │
│                                                            │
│ Find active parking facilities                             │
│ or manage your own operations.                             │
│                                                            │
│ [ EXPLORE PARKINGS ]       [ OWNER LOGIN ]                 │
│                                                            │
│                                           27.4518° S       │
│                                           58.9867° W       │
└────────────────────────────────────────────────────────────┘
```

Avoid vague claims such as:

> The future of smart parking.

## Product visual

Instead of a 3D dashboard screenshot:

```text
P / 01
────────────────────────────────

CENTRAL

42 / 64
OCCUPIED

████████████████████░░░░░░░░

AB123CD                  01:42
AE532LO                  00:17
```

A flat operational/signage composition is more distinctive.

## Secondary section

Avoid three generic benefit cards.

Prefer:

```text
DISCOVER                         OPERATE

Find active parking.             Run your facility.
Location.                        Capacity.
Rate.                            Check-ins.
Availability.                    Sessions.
                                 Checkout.
```

---

# 21. Parking catalog

## Purpose

Discover active facilities.

Do not imitate marketplace/e-commerce interfaces.

## Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ PARKCORE                           PARKINGS   SIGN IN         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ PARKINGS                                                     │
│ Find an active facility.                                     │
│                                                              │
│ [ Search location _________________________________ ]         │
│                                                              │
│ RATE                  AVAILABILITY                            │
│ [ ALL ▼ ]             [ AVAILABLE ▼ ]                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 01                                                           │
│ CENTRAL                                      AVAILABLE       │
│ Av. Corrientes 1842                                         │
│ Resistencia, Chaco                                          │
│                                                              │
│ ARS 2.400 / H                    18 / 64 FREE            →   │
├──────────────────────────────────────────────────────────────┤
│ 02                                                           │
│ NORTE                                        AVAILABLE       │
│ Av. Example 382                                              │
│                                                              │
│ ARS 1.800 / H                    09 / 24 FREE            →   │
├──────────────────────────────────────────────────────────────┤
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

Rows are the default.

Cards may be used only when viewport/layout makes them more useful.

---

# 22. Public parking detail

```text
┌──────────────────────────────────────────────────────────────┐
│ ← PARKINGS                                                   │
│                                                              │
│ P / 01                                                       │
│ CENTRAL                                      ● ACTIVE        │
│ Av. Corrientes 1842                                          │
│ Resistencia, Chaco                                           │
│                                                              │
├───────────────────────────────┬──────────────────────────────┤
│ ARS 2.400                     │ 64                           │
│ PER HOUR                      │ CAPACITY                     │
├───────────────────────────────┴──────────────────────────────┤
│                                                              │
│ [ PARKING IMAGE / ARCHITECTURAL AREA ]                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ABOUT                                                        │
│ Description...                                               │
│                                                              │
│ LOCATION                                                     │
│ -27.4518                                                     │
│ -58.9867                                                     │
│                                                              │
│ [ OPEN MAP ]                                                 │
└──────────────────────────────────────────────────────────────┘
```

No reservation CTA.

---

# 23. Authentication

## Desktop

```text
┌─────────────────────────────────────┬────────────────────────┐
│ PARKCORE                            │ SIGN IN                │
│                                     │                        │
│ 42 / 64                             │ Email                  │
│ CURRENT OCCUPANCY                   │ [____________________] │
│                                     │                        │
│ ██████████████░░░░░░                │ Password               │
│                                     │ [____________________] │
│ P / OPERATIONS                      │                        │
│                                     │ [ CONTINUE ]           │
│                                     │                        │
│                                     │ Create account →       │
└─────────────────────────────────────┴────────────────────────┘
```

Mobile:

Only form + brand.

No useless illustration.

---

# 24. Owner overview

The overview is operational, not analytics-heavy.

## Desktop wireframe

```text
┌─────────────┬────────────────────────────────────────────────┐
│ PARKCORE    │ OPERATIONS                                     │
│             │ Monday / 17 Aug                                │
│ Overview    │                                                │
│ Parkings    │ 3 PARKINGS / 2 ACTIVE                          │
│             │                                                │
│             ├────────────────────────────────────────────────┤
│             │ CENTRAL / P01                    ● ACTIVE       │
│             │                                                │
│             │ 42 / 64                                        │
│             │ OCCUPIED                                       │
│             │ ███████████████████████░░░░░░░                 │
│             │                                                │
│             │ ACTIVE SESSIONS     42                         │
│             │ AVAILABLE           22              OPEN →     │
│             ├────────────────────────────────────────────────┤
│ Daniel      │ NORTE / P02                      ● ACTIVE       │
│ Profile     │ ...                                            │
│ Sign out    │                                                │
└─────────────┴────────────────────────────────────────────────┘
```

No fake charts.

---

# 25. Parking list — owner

```text
PARKINGS                                         NEW PARKING +

03 TOTAL

────────────────────────────────────────────────────────────

01  CENTRAL
    Av. Corrientes 1842

    ● ACTIVE      42 / 64      ARS 2.400/H              →

────────────────────────────────────────────────────────────

02  NORTE

    ○ INACTIVE    0 / 24       ARS 1.800/H              →
```

Inactive facilities remain readable but visually subdued.

---

# 26. Parking overview

This is the central product screen.

## Desktop wireframe

```text
┌─────────────┬────────────────────────────────────────────────┐
│ PARKCORE    │ CENTRAL / P01                    ● ACTIVE       │
│             │ Av. Corrientes 1842              CHECK IN +    │
│ Overview    │                                                │
│ Parkings    ├───────────────────────┬────────────────────────┤
│             │ 42 / 64               │ ARS 2.400              │
│             │ OCCUPIED              │ HOURLY RATE            │
│             ├───────────────────────┴────────────────────────┤
│             │ █████████████████████████░░░░░░░               │
│             │                                                │
│             │ ACTIVE SESSIONS                  HISTORY →      │
│             │                                                │
│             │ PLATE        TYPE      START      ELAPSED       │
│             │ ──────────────────────────────────────────────  │
│             │ AB 123 CD    CAR       16:12      01:43     →  │
│             │ AE 392 KM    MOTO      17:03      00:52     →  │
│             │ AC 921 ZZ    CAR       14:21      03:34     →  │
│ Daniel      │                                                │
│ Profile     │                                                │
└─────────────┴────────────────────────────────────────────────┘
```

Priority:

1. facility identity;
2. occupancy;
3. check-in;
4. active sessions;
5. history.

---

# 27. Mobile parking overview

```text
┌────────────────────────────┐
│ PARKCORE         P / 01    │
├────────────────────────────┤
│ CENTRAL          ● ACTIVE  │
│ Corrientes 1842            │
│                            │
│ 42 / 64                    │
│ OCCUPIED                   │
│                            │
│ ███████████████░░░░░       │
│                            │
│ ARS 2.400 / H              │
│                            │
│ [ CHECK IN ]               │
│                            │
│ ACTIVE — 42                │
│ ─────────────────────────  │
│ AB 123 CD                  │
│ Toyota Corolla             │
│ 01:43                  →   │
│ ─────────────────────────  │
│ AE 392 KM                  │
│ Motorcycle                 │
│ 00:52                  →   │
│                            │
├────────────────────────────┤
│ Home   Parkings   Profile  │
└────────────────────────────┘
```

Mobile is an operational target, not an afterthought.

---

# 28. Check-in

Desktop:

Prefer a wide side panel/sheet.

```text
┌────────────────────────────────────────┐
│ CHECK IN                         ×      │
│ ─────────────────────────────────────  │
│                                        │
│ PLATE                                  │
│ [ AB123CD________________________ ]     │
│                                        │
│ VEHICLE                                │
│ Type                                   │
│ [ Car ▼ ]                              │
│                                        │
│ Brand                                  │
│ [ Toyota________________________ ]      │
│                                        │
│ Model                                  │
│ [ Corolla_______________________ ]      │
│                                        │
│ VISITOR — OPTIONAL                     │
│ Name                                   │
│ [_______________________________ ]      │
│                                        │
│ Phone                                  │
│ [_______________________________ ]      │
│                                        │
│ Notes                                  │
│ [_______________________________ ]      │
│                                        │
│ ─────────────────────────────────────  │
│                         CANCEL          │
│ [ START SESSION ]                      │
└────────────────────────────────────────┘
```

Plate is always first.

Known vehicle:

```text
VEHICLE FOUND

AB 123 CD
Toyota Corolla

Known vehicle data loaded.
```

---

# 29. Session detail

```text
AB 123 CD                                      ● ACTIVE

Toyota Corolla
CAR

──────────────────────────────────────────────────────

STARTED
16:12

ELAPSED
01:43

RATE
ARS 2.400 / H

VISITOR
Juan Perez
+54 ...

NOTES
...

──────────────────────────────────────────────────────

[ CHECK OUT ]                          [ CANCEL SESSION ]
```

---

# 30. Checkout

Confirmation must show financial meaning.

```text
CHECK OUT

AB 123 CD
Toyota Corolla

────────────────────────────

STARTED
16:12

CURRENT TIME
18:04

CHARGED
2 HOURS

RATE
ARS 2.400 / H

────────────────────────────

TOTAL
ARS 4.800

[ COMPLETE CHECKOUT ]

CANCEL
```

Do not use generic:

> Are you sure?

---

# 31. Cancel

```text
CANCEL SESSION

AB 123 CD

This session will be marked as cancelled.
No amount will be charged.

[ KEEP ACTIVE ]

[ CANCEL SESSION ]
```

---

# 32. History

Desktop:

```text
SESSION HISTORY

[ Search plate________________ ] [ STATUS ▼ ] [ DATE ▼ ]

DATE       PLATE       DURATION       STATUS        TOTAL
────────────────────────────────────────────────────────────
17 AUG     AB123CD     02:00          COMPLETED     4.800
17 AUG     AE931KK     —              CANCELLED     —
16 AUG     AD829LM     01:00          COMPLETED     2.400
```

Mobile:

```text
AB 123 CD                         COMPLETED
17 AUG · 02:00
ARS 4.800
────────────────────────────────────────
```

Avoid horizontal scrolling tables on mobile.

---

# 33. Create/Edit parking

Use one-page semantic grouping.

```text
CREATE PARKING

GENERAL
Name
Description
Image

LOCATION
Address
Latitude
Longitude

OPERATIONS
Capacity
Hourly rate
Currency

STATUS
Active
```

No multi-step wizard for this model.

---

# 34. Profile

Keep intentionally simple.

```text
PROFILE

ACCOUNT
Name
Email

SECURITY
Change password

SESSION
Sign out
```

Not every screen needs a unique visual gimmick.

---

# 35. Empty states

Use typography and action, not illustrations.

Example:

```text
NO ACTIVE SESSIONS

This parking currently has no vehicles inside.

CHECK IN A VEHICLE →
```

Example:

```text
NO PARKINGS YET

Create your first facility to start operating ParkCore.

CREATE PARKING →
```

---

# 36. Loading

Prefer skeletons that reflect the final structure.

Avoid full-page spinners where possible.

Spinner is acceptable for:

- one button mutation;
- one short isolated operation.

---

# 37. Errors

Global:

```text
SOMETHING WENT WRONG

We couldn't load this parking.

TRY AGAIN
```

Field/business errors should appear near the relevant control.

Example:

```text
PLATE

[ AB123CD ]

This vehicle already has an active session.
```

Do not use a toast as the only representation of form failure.

---

# 38. Toasts

Appropriate:

```text
Parking updated.
Session started.
Session completed.
```

Avoid using toasts for:

- loading;
- normal navigation;
- field validation;
- trivial feedback.

---

# 39. Motion

Rule:

> Motion communicates state; it does not decorate.

Appropriate:

- dialog/sheet entrance;
- status transition;
- list insert/remove;
- occupancy update;
- toast;
- very small page content transition.

Avoid:

- parallax;
- cursor effects;
- 3D cards;
- animated backgrounds;
- scroll-triggered heading choreography.

Typical timing:

```text
120–220ms
```

Respect reduced motion.

---

# 40. Responsive model

Suggested conceptual breakpoints:

```text
mobile       < 640
tablet       640–1023
desktop      1024–1439
wide         >= 1440
```

These are not hard design requirements; implementation may use Tailwind defaults when appropriate.

## Mobile priorities

Owner parking screen priority:

1. occupancy;
2. check-in;
3. active sessions;
4. rate;
5. history/navigation.

Do not preserve desktop information density at all costs.

---

# 41. Accessibility

Target at least WCAG AA.

Requirements:

- semantic landmarks;
- proper heading hierarchy;
- real form labels;
- visible keyboard focus;
- keyboard-operable dialogs and menus;
- minimum practical touch targets;
- no status communicated by color alone;
- reduced-motion support;
- adequate light/dark contrast;
- semantic tables when data is tabular;
- accessible error associations.

---

# 42. Iconography

Use one consistent line icon family when implementation needs it.

Rule:

> If text is clearer than an icon, use text.

Avoid icon-only operational actions unless universally obvious and properly labeled.

---

# 43. Product language

Tone:

- concise;
- operational;
- neutral.

Good:

```text
Session started.
Parking updated.
Vehicle already active.
Parking is at full capacity.
```

Avoid:

```text
Awesome!
You're all set! 🎉
Amazing!
```

---

# 44. UI terminology

Backend terminology may remain technical.

Frontend should use human labels.

```text
Backend                 UI

ParkingSession          Session
hourlyRateCents         Rate
totalAmountCents        Total
isActive                Active / Inactive
```

Do not expose implementation field names.

---

# 45. Authentication UX

The frontend implementation must define:

- token persistence;
- logout;
- startup auth resolution;
- protected routes;
- redirect after login;
- 401 handling;
- expired session handling.

Avoid visible auth flicker:

```text
owner page
→ login flash
→ owner page
```

During auth resolution use a minimal neutral shell.

---

# 46. API mapping

Every implemented screen must explicitly map to generated OpenAPI operations.

Conceptual mapping:

```text
Parking catalog
→ GET /parkings

Parking detail
→ GET /parkings/:id

Owner parkings
→ GET /parkings/me

Parking create
→ POST /parkings

Parking update
→ PATCH /parkings/:id

Active sessions
→ GET /parkings/:parkingId/sessions/active

Session history
→ GET /parkings/:parkingId/sessions

Check-in
→ POST /parkings/:parkingId/sessions/check-in

Session detail
→ GET /sessions/:sessionId

Checkout
→ POST /sessions/:sessionId/check-out

Cancel
→ PATCH /sessions/:sessionId/cancel
```

The generated API client is the HTTP type source of truth.

Do not manually duplicate API response interfaces in the web app.

---

# 47. Frontend source organization

Target organization:

```text
apps/web/src/
├─ app/
│  ├─ router.tsx
│  └─ providers.tsx
├─ routes/
│  ├─ public/
│  └─ owner/
├─ features/
│  ├─ auth/
│  ├─ parkings/
│  └─ sessions/
├─ components/
│  ├─ ui/
│  └─ layout/
├─ lib/
│  └─ api/
└─ styles/
```

Feature-first organization.

Avoid giant generic folders containing unrelated product logic.

---

# 48. State model

Use:

```text
TanStack Query
→ server state

URL
→ search/filter state where shareable

React local state
→ temporary UI state

React Hook Form
→ form state
```

Do not add Redux/Zustand unless a concrete requirement appears.

---

# 49. Representative implementation screens

The visual system is expressed most clearly through:

1. **Public Parking Catalog**
2. **Owner Parking Overview**
3. **Check-in + Checkout flow**

Together they exercise:

- light theme;
- dark theme;
- typography;
- domain components;
- tables/lists;
- forms;
- dialogs/sheets;
- responsive behavior;
- operational state;
- real API data.

If these screens feel correct, the rest of ParkCore should follow the same language.

---

# 50. Implementation sequence

## Phase 4.1 — Design foundation

Implement:

- fonts;
- CSS/Tailwind tokens;
- light/public theme;
- dark/owner theme;
- spacing;
- radius;
- base typography;
- layout constants;
- focus style.

## Phase 4.2 — UI primitives

Implement only needed primitives:

- Button
- Input
- Textarea
- Select
- Sheet/Dialog
- Dropdown
- Tabs
- Tooltip
- Toast
- Skeleton
- EmptyState

## Phase 4.3 — Domain components

Implement:

- Plate
- ParkingIdentity
- ParkingStatus
- SessionStatus
- OccupancyMeter
- Metric
- RateDisplay
- SessionRow
- ParkingListItem

## Phase 4.4 — Shells

Implement:

- PublicLayout
- OwnerLayout
- public navigation
- desktop owner sidebar
- owner mobile navigation

## Phase 4.5 — Representative screens

Implement and visually audit:

- Parking Catalog
- Parking Overview
- Check-in
- Checkout

Do not continue until these establish the intended design language.

## Phase 4.6 — Public experience

Implement:

- Landing
- Catalog
- Parking Detail

## Phase 4.7 — Authentication

Implement:

- Login
- Register
- auth persistence
- protected routes
- logout
- 401 behavior

## Phase 4.8 — Owner management

Implement:

- Overview
- Parking list
- Create Parking
- Edit Parking
- Profile

## Phase 4.9 — Parking operations

Implement:

- active sessions
- session history
- session detail
- check-in
- checkout
- cancel

## Phase 4.10 — UX states

Implemented:

- loading;
- empty;
- error;
- mutation pending;
- unauthorized;
- not-found;
- network failures.

## Phase 4.11 — Responsive/accessibility

A formal responsive and accessibility pass covers all public and owner screens.

## Phase 4.12 — Testing and polish

ParkCore 1.0 includes:

- component/form tests;
- auth tests;
- critical feature tests;
- a small Playwright E2E suite;
- Lighthouse review;
- bundle review;
- final interaction/motion polish.

---

# 51. Definition of Done — Frontend Design

The following design decisions are implemented and remain stable for ParkCore 1.0:

- product surfaces;
- information architecture;
- routes;
- user journeys;
- screen inventory;
- visual direction;
- public/light system;
- owner/dark system;
- typography roles;
- spacing/radius rules;
- component language;
- representative wireframes;
- forms;
- states;
- responsive strategy;
- motion rules;
- accessibility requirements;
- API mapping;
- implementation order.

---

# 52. Final design statement

ParkCore Web 1.0 should feel:

**editorial and architectural on the outside; matte, dark and operational on the inside.**

Its identity should come from:

- near-black and off-white surfaces;
- disciplined grayscale;
- low radii;
- thin structural borders;
- very few shadows;
- mono operational data;
- parking plate treatment;
- occupancy visualization;
- technical parking identifiers;
- rows and grids instead of endless cards;
- real operational data instead of fake analytics;
- concise product language;
- restrained semantic color;
- fast, functional motion;
- serious mobile operation.

The objective is not to make ParkCore visually loud.

The objective is to make it **recognizable, coherent and deliberate**.
