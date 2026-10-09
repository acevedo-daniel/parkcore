# shadcn/ui and Tailwind CSS v4

Use the project's existing setup. Sources: [theming](https://ui.shadcn.com/docs/theming), [Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [Next.js dark mode](https://ui.shadcn.com/docs/dark-mode/next), and [next/font](https://nextjs.org/docs/app/api-reference/components/font).

## Primitive setup

Ask before running init/add or installing fonts, themes, or browsers: these commands add dependencies. Once authorized, use the project's package runner:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label textarea select checkbox dialog sheet dropdown-menu table badge card tabs tooltip skeleton sonner
```

Read `components.json` for aliases and the CSS file. Enable CSS-variable theming; keep primitives in `components/ui/`. Use [blocks](https://ui.shadcn.com/blocks) and component examples as code references for the required section, adapting content and tokens to the product.

## Tokens and themes

Store full `oklch()` colors in `:root` and override the same tokens in `.dark`. Expose semantic pairs through `@theme inline`; never wrap a full oklch token with `hsl()`.

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --font-sans: var(--font-ui);
  --font-display: var(--font-heading);
}
```

Retain the generated mappings for card, popover, secondary, muted, accent, destructive, border, input, ring, and any chart/sidebar tokens used by the project. Set `--radius` and contrast-checked `--success`, `--warning`, `--info` plus their `-foreground` pairs in both schemes; values come from PROJECT-DESIGN, not this snippet.

Use `next/font` to load approved families with `variable: "--font-ui"` and `variable: "--font-heading"`; attach their `.variable` classes on the root layout. Use local fonts when brand files are supplied. For a single family, map both roles to its variable.

When both schemes are approved, wrap the layout with `next-themes` using `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`. Set `suppressHydrationWarning` on `<html>` and wait for mount before rendering theme-dependent toggle state. A single-scheme product does not need a switch.

## Variants and utilities

- Customize tokens first; for a distinct control role, add a `cva` variant inside `components/ui/` and expose it through the primitive's typed variant prop.
- Use the project's `cn()` helper (typically `clsx` plus `tailwind-merge`) for conditional utility composition; never use it to hide per-call color, radius, or shadow overrides.
- Use `text-balance` for headings, `tabular-nums` for comparable numbers, and `size-*` for equal width/height controls or icons.
- Use one lucide stroke width (default 2) across equal-role icons; use an existing approved icon family instead when the product already has one.

## Reject raw interactive elements

Add this entry to the existing ESLint flat config, preserving its parser and existing rules. Merge the selectors into any existing `no-restricted-syntax` array so other restrictions stay active. Adjust file/ignore patterns for the project's source roots.

```javascript
{
  files: ["**/*.{jsx,tsx}"],
  ignores: ["**/components/ui/**"],
  rules: {
    "no-restricted-syntax": [
      "error",
      ...["button", "input", "select", "textarea", "dialog"].map((name) => ({
        selector: `JSXOpeningElement[name.type='JSXIdentifier'][name.name='${name}']`,
        message: "Compose a primitive from components/ui instead of a raw interactive element.",
      })),
    ],
  },
}
```

This `ignores` applies only to this entry: primitive files still receive normal linting from other entries. In legacy configs, put the same rule in an `overrides` entry with `excludedFiles: ["**/components/ui/**"]` instead.

Verify one page fixture containing all five raw tags fails lint, while a primitive under `components/ui/` and a page composing `Button` pass. The rule rejects lowercase JSX elements; aliases or `createElement()` must still respect the three-layer contract in review.
