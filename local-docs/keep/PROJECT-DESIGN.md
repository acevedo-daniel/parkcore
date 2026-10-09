---
status: draft
---

# Project Design

## Brief

- Product: ParkCore is a bilingual app for everyday parking operations. Owners manage parking facilities and vehicle stays, and visitors browse facilities listed for public discovery.
- Audience and context: Public visitors browse, search, filter, and view eligible facilities. Owners and operators manage their facilities and parking sessions through the browser app.
- Expression: E1 Branded Product. Keep the existing yellow and ink identity visible across public discovery and owner operations while preserving clear operational hierarchy.
- Density: D2 Standard Workspace. Use 16px body text, grouped sections, and planar table rows for a readable operations baseline.
- Must feel: trustworthy, fast to scan, distinctly yellow and ink.
- Must not feel: generic gray SaaS, playful, cluttered.
- Signature move: Feature panels use `rounded-signature`, with 32px corners except for a 64px bottom-right corner, an Outfit `type-display` heading, and a `brand` or `inverse` surface.
- Color schemes: Light, dark, and system. System is the default. Users can change appearance in the public header, owner sidebar, and profile.

## Voice

Language selects copy; locale formats dates, numbers, and currency; register sets tone, pronouns, and regionalisms. Never infer register, pronouns, slang, or regional voice from locale.

- Language and BCP 47 locale: Spanish (`es-AR`) is primary; English (`en-US`) is secondary.
- Register: Neutral, direct second-person singular. Current Spanish prompts use tuteo forms such as “Ingresa” and “Puedes”; avoid voseo.
- Regional voice: Locale controls formatting only. Use neutral wording without slang or deliberately Rioplatense phrasing.
- Terminology: Use “cochera” for a parking facility, “estadía” for a stay, “patente” for a vehicle plate, and “ocupación” and “capacidad” for operational measures. Avoid changing these established product terms.
- Microcopy: Spanish-first examples include “Ingresa una patente.”, “Crea tu primera cochera para empezar a registrar la operación.”, and “No pudimos conectar con ParkCore. Revisa tu conexión y prueba de nuevo.” Adapted English examples are “Enter a vehicle plate.”, “Create your first facility to start recording operations.”, and “We could not connect to ParkCore. Check your connection and try again.” These examples are from the current locale catalogs.

## Visual rules

- Typography roles: Outfit sets display, page-title, heading, eyebrow, and metric styles through `type-display`, `type-page-title`, `type-heading`, `type-section-title`, `type-eyebrow`, and `type-metric`. Nunito Sans carries interface, labels, body copy, and operational values. Use tabular numerals for values that need to scan quickly. Reserve JetBrains Mono for vehicle plates, keyboard shortcuts, and short identifiers through `type-code`.
- Color character: Keep ParkCore yellow as the brand anchor against warm neutrals and ink. Use a softened gold for selected brand surfaces, blue-teal for information and completed stays, forest green for active and successful states, amber for warnings, and brick red for destructive states. Inactive items use a defined neutral outline. Reuse the same hues in charts and keep semantic colors local to status.
- Accent usage: Use `brand` only on the landing hero band, login brand panel, empty-state media, selected segmented options, and route loading bar. Keep at most one brand surface per view and never use brand for body text. Use neutral `accent` for hover and selected menu or ghost-control surfaces.
- Shape character: Buttons use `rounded-lg` (12px) with a 2px border; the appearance selector uses a 12px outer frame and 10px inner segments; status badges use `rounded-md` (10px); fields use `rounded-md` (10px); cards use `rounded-lg` (12px); dialogs and sheets use `rounded-xl` (16px); marketing panels use `rounded-3xl` (32px); plates use `rounded-xs` (4px). Reserve pills for navigation actions and filter segments. The signature panel uses three 32px corners and a 64px bottom-right corner.
- Depth: Static surfaces use a border without a shadow. Controls use `shadow-xs`; clickable discovery cards use `shadow-md` on hover; menus and popovers use `shadow-lg`; dialogs and sheets use `shadow-xl`.
- Motion character: Use 140ms micro feedback, 180ms standard transitions, and 220ms overlays with `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`). Animate color, background, border, shadow, opacity, and transform. Press feedback uses `scale-98`. Hover lift is limited to clickable discovery cards.
- Icon family and stroke: Use Lucide icons at stroke width 2. Controls use `size-4`; feature media uses `size-5`.
- Imagery: Use canonical parking images with `object-cover`; use `aspect-4/3` for cards and `aspect-16/10` for detail media.

## Token registry

Implemented in: `apps/web/src/styles/index.css`

The light warning solid is adjusted from `oklch(0.580 0.141 54.6)` to `oklch(0.570 0.141 54.6)`. The original white-foreground pair measured 4.49:1; the adjusted pair measures 4.69:1 and meets the 4.5:1 text contrast minimum.

```css
:root {
  --font-sans: 'Nunito Sans Variable', 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Outfit Variable', 'Nunito Sans Variable', 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-2xs: 0.6875rem;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.375rem;
  --text-2xl: 1.75rem;
  --text-3xl: 2.25rem;
  --text-4xl: 3rem;
  --text-display: clamp(2.75rem, 6vw, 5rem);
  --text-page-title: clamp(1.75rem, 4vw, 2.5rem);
  --text-section-title: clamp(1.15rem, 2vw, 1.4rem);
  --text-metric: clamp(2rem, 4vw, 3rem);

  --leading-display: 0.95;
  --leading-tight: 1.05;
  --leading-heading: 1.15;
  --leading-section: 1.25;
  --leading-normal: 1.5;

  --tracking-display: -0.03em;
  --tracking-title: -0.02em;
  --tracking-heading: -0.025em;
  --tracking-section: -0.01em;
  --tracking-body: -0.005em;
  --tracking-label: 0.01em;
  --tracking-code: 0.035em;
  --tracking-eyebrow: 0.08em;
  --tracking-operational: 0;

  --motion-micro: 140ms;
  --motion-standard: 180ms;
  --motion-overlay: 220ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --container-public: 80rem;
  --container-owner: 90rem;

  --radius: 0.75rem;
  --radius-xs: calc(var(--radius) - 8px);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 12px);
  --radius-3xl: calc(var(--radius) + 20px);
  --radius-signature: 4rem;

  --background: oklch(0.975 0.004 106.5);
  --foreground: oklch(0.190 0.007 258.4);
  --card: oklch(1.000 0.000 0.0);
  --card-foreground: var(--foreground);
  --popover: oklch(1.000 0.000 0.0);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.190 0.007 258.4);
  --primary-foreground: oklch(1.000 0.000 0.0);
  --secondary: oklch(1.000 0.000 0.0);
  --secondary-foreground: oklch(0.190 0.007 258.4);
  --muted: oklch(0.957 0.007 106.5);
  --muted-foreground: oklch(0.510 0.013 102.0);
  --accent: oklch(0.957 0.007 106.5);
  --accent-foreground: var(--foreground);
  --destructive: oklch(0.520 0.150 29.0);
  --destructive-foreground: oklch(1.000 0.000 0.0);
  --destructive-soft: oklch(0.953 0.018 28.0);
  --destructive-soft-foreground: oklch(0.410 0.134 27.6);
  --success: oklch(0.505 0.095 151.0);
  --success-foreground: oklch(1.000 0.000 0.0);
  --success-soft: oklch(0.962 0.015 154.0);
  --success-soft-foreground: oklch(0.392 0.075 151.0);
  --warning: oklch(0.570 0.141 54.6);
  --warning-foreground: oklch(1.000 0.000 0.0);
  --warning-soft: oklch(0.964 0.028 74.3);
  --warning-soft-foreground: oklch(0.415 0.100 54.5);
  --info: oklch(0.505 0.115 221.0);
  --info-foreground: oklch(1.000 0.000 0.0);
  --info-soft: oklch(0.958 0.015 223.0);
  --info-soft-foreground: oklch(0.424 0.095 223.0);
  --brand: oklch(0.860 0.160 88.0);
  --brand-foreground: oklch(0.190 0.007 258.4);
  --brand-soft: oklch(0.963 0.050 93.0);
  --brand-strong: oklch(0.790 0.145 88.0);
  --foreground-secondary: oklch(0.406 0.012 105.0);
  --border: oklch(0.790 0.014 105.0);
  --border-subtle: oklch(0.890 0.010 105.0);
  --border-strong: oklch(0.570 0.014 105.0);
  --input: var(--border);
  --ring: oklch(0.520 0.140 222.0);
  --inverse: oklch(0.190 0.007 258.4);
  --inverse-foreground: oklch(1.000 0.000 0.0);
  --overlay: oklch(0.190 0.007 258.4 / 0.48);
  --chart-1: oklch(0.190 0.007 258.4);
  --chart-2: oklch(0.596 0.013 105.0);
  --chart-3: oklch(0.750 0.145 88.0);
  --chart-4: oklch(0.505 0.115 221.0);
  --chart-5: oklch(0.505 0.095 151.0);
  --sidebar: var(--card);
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--accent);
  --sidebar-accent-foreground: var(--foreground);
  --sidebar-border: var(--border-strong);
  --sidebar-ring: var(--ring);

  --shadow-xs: 0 1px 1px oklch(0.190 0.007 258.4 / 0.05);
  --shadow-sm: 0 1px 2px oklch(0.190 0.007 258.4 / 0.08);
  --shadow-md: 0 3px 8px oklch(0.190 0.007 258.4 / 0.09);
  --shadow-lg: 0 12px 32px oklch(0.000 0.000 0.0 / 0.2);
  --shadow-xl: 0 24px 64px oklch(0.000 0.000 0.0 / 0.28);
}

[data-theme='dark'] {
  --background: oklch(0.183 0.007 135.0);
  --foreground: oklch(0.968 0.008 114.2);
  --card: oklch(0.213 0.009 137.8);
  --card-foreground: var(--foreground);
  --popover: oklch(0.272 0.010 132.6);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.968 0.008 114.2);
  --primary-foreground: oklch(0.183 0.007 135.0);
  --secondary: oklch(0.251 0.010 132.7);
  --secondary-foreground: oklch(0.968 0.008 114.2);
  --muted: oklch(0.251 0.010 132.7);
  --muted-foreground: oklch(0.740 0.014 104.0);
  --accent: oklch(0.295 0.012 108.0);
  --accent-foreground: var(--foreground);
  --destructive: oklch(0.700 0.120 26.0);
  --destructive-foreground: oklch(0.183 0.007 135.0);
  --destructive-soft: oklch(0.272 0.040 26.0);
  --destructive-soft-foreground: oklch(0.860 0.055 25.0);
  --success: oklch(0.720 0.090 151.0);
  --success-foreground: oklch(0.183 0.007 135.0);
  --success-soft: oklch(0.298 0.035 153.0);
  --success-soft-foreground: oklch(0.880 0.055 153.0);
  --warning: oklch(0.779 0.133 64.9);
  --warning-foreground: oklch(0.183 0.007 135.0);
  --warning-soft: oklch(0.298 0.044 67.5);
  --warning-soft-foreground: oklch(0.902 0.074 70.0);
  --info: oklch(0.740 0.105 222.0);
  --info-foreground: oklch(0.183 0.007 135.0);
  --info-soft: oklch(0.286 0.045 223.0);
  --info-soft-foreground: oklch(0.880 0.050 223.0);
  --brand: oklch(0.875 0.155 89.0);
  --brand-foreground: oklch(0.183 0.007 135.0);
  --brand-soft: oklch(0.297 0.040 91.0);
  --brand-strong: oklch(0.820 0.145 89.0);
  --foreground-secondary: oklch(0.843 0.012 103.0);
  --border: oklch(0.460 0.012 108.0);
  --border-subtle: oklch(0.360 0.010 103.0);
  --border-strong: oklch(0.720 0.015 105.0);
  --input: var(--border);
  --ring: oklch(0.740 0.105 222.0);
  --inverse: oklch(0.968 0.008 114.2);
  --inverse-foreground: oklch(0.183 0.007 135.0);
  --overlay: oklch(0.000 0.000 0.0 / 0.68);
  --chart-1: oklch(0.968 0.008 114.2);
  --chart-2: oklch(0.710 0.014 104.0);
  --chart-3: oklch(0.875 0.155 89.0);
  --chart-4: oklch(0.740 0.105 222.0);
  --chart-5: oklch(0.720 0.090 151.0);
  --sidebar: var(--card);
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--accent);
  --sidebar-accent-foreground: var(--foreground);
  --sidebar-border: var(--border-strong);
  --sidebar-ring: var(--ring);
}
```

| Role | Size / line height | Weight | Tracking | Class |
| --- | --- | --- | --- | --- |
| Display | `clamp(2.75rem, 6vw, 5rem)` / `0.95` | 700 | `-0.03em` | `type-display` |
| Page title | `clamp(1.75rem, 4vw, 2.5rem)` / `1.15` | 700 | `-0.02em` | `type-page-title` |
| Heading | `1.75rem` / `1.05` | 700 | `-0.025em` | `type-heading` |
| Section title | `clamp(1.15rem, 2vw, 1.4rem)` / `1.25` | 600 | `-0.01em` | `type-section-title` |
| Body | `1rem` / `1.5` | 400 | `-0.005em` | body default |
| Small | `0.875rem` / `1.5` | 500 | body tracking | `text-sm` |
| Label | `0.75rem` / `1.5`, Nunito Sans | 700 | `0.01em` | `type-label` |
| Eyebrow | `0.6875rem` / `1.5`, Outfit | 600 | `0.08em` | `type-eyebrow` |
| Metric | `clamp(2rem, 4vw, 3rem)` / `1`, Outfit | 700 | `-0.03em`, tabular numerals | `type-metric` |
| Operational | Inherited size, Nunito Sans | Inherited | Normal, tabular numerals | `type-operational` |
| Code | Inherited size, JetBrains Mono | Inherited | `0.035em`, tabular numerals | `type-code` |

| Font role | Family and fallback | Weights | Token / class |
| --- | --- | --- | --- |
| UI | Nunito Sans Variable, Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif | 200–1000 | `--font-sans` / `font-sans` |
| Heading | Outfit Variable, Nunito Sans Variable, Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif | 100–900 | `--font-display` / `font-display` |
| Codes and plates | JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace | 400, 600, 700 | `--font-mono` / `type-code` |

Nunito Sans and Outfit are self-hosted variable Latin fonts in `apps/web/public/fonts/`, with their SIL Open Font License files alongside them. Plus Jakarta Sans remains a local fallback. JetBrains Mono is reserved for codes and vehicle plates.

## Breakpoints and layout modes

The default content breakpoints are `md` at 768px and `lg` at 1024px. The deliberate `wide` override begins at 75rem (1200px), when the persistent owner sidebar and public desktop navigation appear.

| Mode | Width | Layout |
| --- | --- | --- |
| Compact | `< 768px` | Public navigation uses its compact menu. Owner operations use the mobile header and bottom navigation. Content follows a single-column reading order by default with mobile gutters. |
| Medium | `768px to < 1200px` | Existing `md` and `lg` content grids may add columns while public and owner shell navigation stays compact. Public content is capped at 80rem and owner content at 90rem. |
| Wide | `>= 1200px` | Public desktop navigation and the persistent owner sidebar are visible. Public content uses an 80rem maximum width; owner content uses a 90rem maximum width. |
