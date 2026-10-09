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

- Typography roles: Outfit sets display, page-title, and heading styles through `type-display`, `type-page-title`, `type-heading`, and `type-section-title`. Nunito Sans carries interface and body copy at 16px `--text-base`, with small text at `text-sm`. JetBrains Mono is reserved for labels, eyebrows, metrics, plates, and operational values, with tabular numerals where values must scan quickly.
- Accent usage: Use `brand` only on the landing hero band, login brand panel, empty-state media, selected segmented options, and route loading bar. Keep at most one brand surface per view and never use brand for body text. Use neutral `accent` for hover and selected menu or ghost-control surfaces.
- Shape character: Controls use `rounded-md` (10px), cards use `rounded-lg` (12px), dialogs and sheets use `rounded-xl` (16px), marketing panels use `rounded-3xl` (32px), and plates use `rounded-xs` (4px). Reserve pills for badges, status, filters, and icon-only header buttons. The signature panel uses three 32px corners and a 64px bottom-right corner.
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
  --tracking-label: 0.08em;
  --tracking-eyebrow: 0.16em;
  --tracking-operational: 0.02em;

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
  --muted-foreground: oklch(0.510 0.012 145.4);
  --accent: oklch(0.957 0.007 106.5);
  --accent-foreground: var(--foreground);
  --destructive: oklch(0.522 0.172 28.1);
  --destructive-foreground: oklch(1.000 0.000 0.0);
  --destructive-soft: oklch(0.953 0.019 21.6);
  --destructive-soft-foreground: oklch(0.410 0.134 27.6);
  --success: oklch(0.515 0.110 156.8);
  --success-foreground: oklch(1.000 0.000 0.0);
  --success-soft: oklch(0.962 0.017 162.8);
  --success-soft-foreground: oklch(0.392 0.079 159.4);
  --warning: oklch(0.570 0.141 54.6);
  --warning-foreground: oklch(1.000 0.000 0.0);
  --warning-soft: oklch(0.964 0.028 74.3);
  --warning-soft-foreground: oklch(0.415 0.100 54.5);
  --info: oklch(0.513 0.135 254.9);
  --info-foreground: oklch(1.000 0.000 0.0);
  --info-soft: oklch(0.958 0.015 251.2);
  --info-soft-foreground: oklch(0.424 0.105 254.0);
  --brand: oklch(0.865 0.177 90.4);
  --brand-foreground: oklch(0.190 0.007 258.4);
  --brand-soft: oklch(0.963 0.069 97.7);
  --brand-strong: oklch(0.794 0.162 90.7);
  --foreground-secondary: oklch(0.406 0.011 150.4);
  --border: oklch(0.835 0.010 125.7);
  --border-subtle: oklch(0.916 0.008 114.2);
  --border-strong: oklch(0.628 0.009 145.5);
  --input: var(--border);
  --ring: oklch(0.569 0.202 259.7);
  --inverse: oklch(0.190 0.007 258.4);
  --inverse-foreground: oklch(1.000 0.000 0.0);
  --overlay: oklch(0.190 0.007 258.4 / 0.48);
  --chart-1: oklch(0.190 0.007 258.4);
  --chart-2: oklch(0.596 0.013 141.2);
  --chart-3: oklch(0.765 0.156 90.7);
  --chart-4: oklch(0.513 0.135 254.9);
  --chart-5: oklch(0.515 0.110 156.8);
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
  --muted-foreground: oklch(0.740 0.014 134.9);
  --accent: oklch(0.295 0.012 135.0);
  --accent-foreground: var(--foreground);
  --destructive: oklch(0.724 0.136 24.8);
  --destructive-foreground: oklch(0.183 0.007 135.0);
  --destructive-soft: oklch(0.272 0.047 24.7);
  --destructive-soft-foreground: oklch(0.876 0.066 23.1);
  --success: oklch(0.749 0.109 159.4);
  --success-foreground: oklch(0.183 0.007 135.0);
  --success-soft: oklch(0.298 0.043 162.9);
  --success-soft-foreground: oklch(0.906 0.070 159.9);
  --warning: oklch(0.779 0.133 64.9);
  --warning-foreground: oklch(0.183 0.007 135.0);
  --warning-soft: oklch(0.298 0.044 67.5);
  --warning-soft-foreground: oklch(0.902 0.074 70.0);
  --info: oklch(0.763 0.122 257.1);
  --info-foreground: oklch(0.183 0.007 135.0);
  --info-soft: oklch(0.286 0.055 255.6);
  --info-soft-foreground: oklch(0.891 0.053 258.0);
  --brand: oklch(0.884 0.173 93.6);
  --brand-foreground: oklch(0.183 0.007 135.0);
  --brand-soft: oklch(0.297 0.049 96.9);
  --brand-strong: oklch(0.834 0.166 93.5);
  --foreground-secondary: oklch(0.843 0.012 128.6);
  --border: oklch(0.405 0.015 137.8);
  --border-subtle: oklch(0.319 0.012 135.0);
  --border-strong: oklch(0.660 0.018 137.1);
  --input: var(--border);
  --ring: oklch(0.763 0.122 257.1);
  --inverse: oklch(0.968 0.008 114.2);
  --inverse-foreground: oklch(0.183 0.007 135.0);
  --overlay: oklch(0.000 0.000 0.0 / 0.68);
  --chart-1: oklch(0.968 0.008 114.2);
  --chart-2: oklch(0.710 0.016 136.1);
  --chart-3: oklch(0.884 0.173 93.6);
  --chart-4: oklch(0.763 0.122 257.1);
  --chart-5: oklch(0.749 0.109 159.4);
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
| Label | `0.75rem` / `1.05`, mono | 600 | `0.08em`, uppercase | `type-label` |
| Eyebrow | `0.6875rem` / `1.05`, mono | 700 | `0.16em`, uppercase | `type-eyebrow` |
| Metric | `clamp(2rem, 4vw, 3rem)` / `1`, mono | 700 | `-0.055em` | `type-metric` |
| Operational | Inherited size, mono | Inherited | `0.02em` | `type-operational` |

| Font role | Family and fallback | Weights | Token / class |
| --- | --- | --- | --- |
| UI | Nunito Sans Variable, Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif | 200–1000 | `--font-sans` / `font-sans` |
| Heading | Outfit Variable, Nunito Sans Variable, Plus Jakarta Sans Variable, ui-sans-serif, system-ui, sans-serif | 100–900 | `--font-display` / `font-display` |
| Labels, metrics, plates | JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace | 400, 600, 700 | `--font-mono` / `font-mono` |

Nunito Sans and Outfit are self-hosted variable Latin fonts in `apps/web/public/fonts/`, with their SIL Open Font License files alongside them. Plus Jakarta Sans remains a local fallback; JetBrains Mono remains the operational face.

## Breakpoints and layout modes

The default content breakpoints are `md` at 768px and `lg` at 1024px. The deliberate `wide` override begins at 75rem (1200px), when the persistent owner sidebar and public desktop navigation appear.

| Mode | Width | Layout |
| --- | --- | --- |
| Compact | `< 768px` | Public navigation uses its compact menu. Owner operations use the mobile header and bottom navigation. Content follows a single-column reading order by default with mobile gutters. |
| Medium | `768px to < 1200px` | Existing `md` and `lg` content grids may add columns while public and owner shell navigation stays compact. Public content is capped at 80rem and owner content at 90rem. |
| Wide | `>= 1200px` | Public desktop navigation and the persistent owner sidebar are visible. Public content uses an 80rem maximum width; owner content uses a 90rem maximum width. |
