import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const stylesheetPath = resolve(scriptDirectory, '../apps/web/src/styles/index.css');
const themeColorPath = resolve(scriptDirectory, '../apps/web/src/app/theme-color.ts');
const themeInitPath = resolve(scriptDirectory, '../apps/web/public/theme-init.js');

export const COLOR_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'destructive-soft',
  'destructive-soft-foreground',
  'success',
  'success-foreground',
  'success-soft',
  'success-soft-foreground',
  'warning',
  'warning-foreground',
  'warning-soft',
  'warning-soft-foreground',
  'info',
  'info-foreground',
  'info-soft',
  'info-soft-foreground',
  'brand',
  'brand-foreground',
  'brand-soft',
  'brand-strong',
  'foreground-secondary',
  'border',
  'border-subtle',
  'border-strong',
  'input',
  'ring',
  'inverse',
  'inverse-foreground',
  'overlay',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
];

const REQUIRED_SHARED_TOKENS = [
  'font-sans',
  'font-display',
  'font-mono',
  'text-2xs',
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-display',
  'text-page-title',
  'text-section-title',
  'text-metric',
  'font-weight-normal',
  'font-weight-medium',
  'font-weight-semibold',
  'font-weight-bold',
  'font-weight-extrabold',
  'spacing-1',
  'spacing-2',
  'spacing-3',
  'spacing-4',
  'spacing-5',
  'spacing-6',
  'spacing-8',
  'spacing-10',
  'spacing-12',
  'spacing-16',
  'spacing-20',
  'spacing-24',
  'spacing-28',
  'spacing-32',
  'leading-display',
  'leading-tight',
  'leading-heading',
  'leading-section',
  'leading-normal',
  'tracking-display',
  'tracking-title',
  'tracking-heading',
  'tracking-section',
  'tracking-body',
  'tracking-label',
  'tracking-eyebrow',
  'tracking-operational',
  'radius',
  'radius-xs',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'radius-2xl',
  'radius-3xl',
  'radius-signature',
  'motion-micro',
  'motion-standard',
  'motion-overlay',
  'ease-out',
  'container-public',
  'container-owner',
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
];

const CONTRAST_PAIRS = [
  ['foreground', 'background', 4.5],
  ['foreground', 'card', 4.5],
  ['foreground-secondary', 'card', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['card-foreground', 'card', 4.5],
  ['popover-foreground', 'popover', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['brand-foreground', 'brand', 4.5],
  ['inverse-foreground', 'inverse', 4.5],
  ['sidebar-foreground', 'sidebar', 4.5],
  ['sidebar-primary-foreground', 'sidebar-primary', 4.5],
  ['destructive-foreground', 'destructive', 4.5],
  ['destructive-soft-foreground', 'destructive-soft', 4.5],
  ['success-foreground', 'success', 4.5],
  ['success-soft-foreground', 'success-soft', 4.5],
  ['warning-foreground', 'warning', 4.5],
  ['warning-soft-foreground', 'warning-soft', 4.5],
  ['info-foreground', 'info', 4.5],
  ['info-soft-foreground', 'info-soft', 4.5],
  ['ring', 'background', 3],
  ['ring', 'card', 3],
  ['border-strong', 'background', 3],
  ['chart-1', 'card', 3],
  ['chart-2', 'card', 3],
];

export function extractCssBlock(stylesheet, marker) {
  const markerIndex = stylesheet.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Could not find CSS block: ${marker}`);

  const openingBrace = stylesheet.indexOf('{', markerIndex);
  assert.notEqual(openingBrace, -1, `Could not find opening brace for CSS block: ${marker}`);
  let depth = 0;

  for (let index = openingBrace; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === '{') depth += 1;
    if (stylesheet[index] === '}') depth -= 1;
    if (depth === 0) return stylesheet.slice(openingBrace + 1, index);
  }

  throw new Error(`Could not close CSS block: ${marker}`);
}

export function parseDeclarations(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(([, name, value]) => [
      name,
      value.trim().replace(/\s+/g, ' '),
    ]),
  );
}

export function resolveColor(token, declarations, seen = new Set()) {
  assert(!seen.has(token), `Circular color alias: ${token}`);
  const value = declarations[token];
  assert(value, `Missing color token: ${token}`);

  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  return alias ? resolveColor(alias[1], declarations, new Set(seen).add(token)) : value;
}

export function parseOklch(value) {
  const parts = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%?)?\s*\)$/i.exec(
    value,
  );
  assert(parts, `Expected an oklch color, got: ${value}`);

  return {
    lightness: Number(parts[1]),
    chroma: Number(parts[2]),
    hue: Number(parts[3]),
    alpha: parts[4] === undefined ? 1 : Number(parts[4]) / (value.includes('%') ? 100 : 1),
  };
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

export function oklchToLinearSrgb(value) {
  const { lightness, chroma, hue } = typeof value === 'string' ? parseOklch(value) : value;
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;

  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function relativeLuminance(color) {
  const channels = typeof color === 'string' ? oklchToLinearSrgb(color) : color;
  return channels.reduce(
    (luminance, channel, index) => luminance + channel * [0.2126, 0.7152, 0.0722][index],
    0,
  );
}

export function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function assertContrast(foreground, background, declarations, minimum, label) {
  const ratio = contrastRatio(
    oklchToLinearSrgb(resolveColor(foreground, declarations)),
    oklchToLinearSrgb(resolveColor(background, declarations)),
  );
  assert(ratio >= minimum, `${label} must meet ${minimum}:1 contrast, got ${ratio.toFixed(2)}:1`);
  return ratio;
}

function toSrgbHex(color) {
  const encoded = oklchToLinearSrgb(color).map((channel) => {
    const srgb = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(clamp(srgb) * 255)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${encoded.join('')}`;
}

function findThemeHex(source, theme) {
  const value = new RegExp(`\\b${theme}:\\s*['\"](#[0-9a-f]{6})['\"]`, 'i').exec(source)?.[1];
  assert(value, `Could not find ${theme} theme-color hex`);
  return value.toLowerCase();
}

export function validateDesignTokens({ stylesheet, themeColorSource, themeInitSource }) {
  const lightTokens = parseDeclarations(
    extractCssBlock(stylesheet, ":root,\n[data-theme='light']"),
  );
  const darkTokens = parseDeclarations(extractCssBlock(stylesheet, "\n[data-theme='dark'] {"));
  const sharedTokens = parseDeclarations(extractCssBlock(stylesheet, ':root {'));
  const themeTokens = parseDeclarations(extractCssBlock(stylesheet, '@theme inline'));

  assert.match(stylesheet, /--color-\*:\s*initial;/, 'Tailwind palette must be reset');
  assert.match(stylesheet, /--shadow-\*:\s*initial;/, 'Tailwind shadow scale must be reset');
  assert.doesNotMatch(
    stylesheet,
    /#[0-9a-f]{3,8}\b|rgba?\s*\(/i,
    'CSS must not contain hex or rgb colors',
  );
  assert.doesNotMatch(stylesheet, /brand-yellow|surface-warm|--ink-|--canvas\b/);

  for (const [scheme, tokens] of [
    ['light', lightTokens],
    ['dark', darkTokens],
  ]) {
    for (const token of COLOR_TOKENS) {
      const color = resolveColor(token, tokens);
      assert.match(color, /^oklch\(/i, `${scheme} ${token} must resolve to oklch()`);
      parseOklch(color);
      assert.equal(themeTokens[`color-${token}`], `var(--${token})`, `theme color ${token}`);
    }

    for (const [foreground, background, minimum] of CONTRAST_PAIRS) {
      assertContrast(
        foreground,
        background,
        tokens,
        minimum,
        `${scheme} ${foreground} on ${background}`,
      );
    }
  }

  for (const token of REQUIRED_SHARED_TOKENS) {
    assert(sharedTokens[token], `Missing shared token: ${token}`);
    if (!token.startsWith('motion-')) {
      assert.equal(themeTokens[token], `var(--${token})`, `theme alias ${token}`);
    }
  }

  assert.equal(themeTokens['breakpoint-wide'], '75rem', 'wide breakpoint');

  const expectedThemeColors = {
    light: toSrgbHex(resolveColor('background', lightTokens)),
    dark: toSrgbHex(resolveColor('background', darkTokens)),
  };
  const moduleColors = {
    light: findThemeHex(themeColorSource, 'light'),
    dark: findThemeHex(themeColorSource, 'dark'),
  };
  const bootstrapColors = {
    light: /theme === 'dark' \? '#[0-9a-f]{6}' : '(#[0-9a-f]{6})'/i.exec(themeInitSource)?.[1],
    dark: /theme === 'dark' \? '(#[0-9a-f]{6})' : '#[0-9a-f]{6}'/i.exec(themeInitSource)?.[1],
  };

  for (const theme of ['light', 'dark']) {
    assert.equal(moduleColors[theme], expectedThemeColors[theme], `${theme} theme-color module`);
    assert.equal(
      bootstrapColors[theme]?.toLowerCase(),
      expectedThemeColors[theme],
      `${theme} theme-init color`,
    );
  }
  assert.match(
    themeInitSource,
    /setAttribute\('content', '#[0-9a-f]{6}'\)/i,
    'bootstrap fallback theme-color',
  );

  const declarations = new Set(
    [...stylesheet.matchAll(/--([a-z0-9-]+)\s*:/gi)].map(([, token]) => token),
  );
  const references = new Set(
    [...stylesheet.matchAll(/var\(\s*--([a-z0-9-]+)/gi)].map(([, token]) => token),
  );
  assert.deepEqual(
    [...references].filter(
      (token) =>
        !declarations.has(token) && !token.startsWith('radix-') && !token.startsWith('tw-'),
    ),
    [],
    'every referenced custom property must be declared',
  );

  return { expectedThemeColors };
}

function run() {
  const stylesheet = readFileSync(stylesheetPath, 'utf8');
  const themeColorSource = readFileSync(themeColorPath, 'utf8');
  const themeInitSource = readFileSync(themeInitPath, 'utf8');
  validateDesignTokens({ stylesheet, themeColorSource, themeInitSource });
  console.log(`Design token contract passed for ${stylesheetPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
