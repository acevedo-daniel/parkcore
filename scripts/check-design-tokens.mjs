import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const stylesheetPath = resolve(scriptDirectory, '../apps/web/src/styles/index.css');
const stylesheet = readFileSync(stylesheetPath, 'utf8');

function extractBlock(marker) {
  const markerIndex = stylesheet.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Could not find CSS block: ${marker}`);

  const openingBrace = stylesheet.indexOf('{', markerIndex);
  let depth = 0;

  for (let index = openingBrace; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === '{') depth += 1;
    if (stylesheet[index] === '}') depth -= 1;
    if (depth === 0) return stylesheet.slice(openingBrace + 1, index);
  }

  throw new Error(`Could not close CSS block: ${marker}`);
}

function parseDeclarations(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim().replace(/\s+/g, ' '),
    ]),
  );
}

function resolveColor(token, declarations, seen = new Set()) {
  assert(!seen.has(token), `Circular color alias: ${token}`);
  const value = declarations[token];
  assert(value, `Missing color token: ${token}`);

  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  return alias ? resolveColor(alias[1], declarations, new Set(seen).add(token)) : value;
}

function parseHexColor(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1];
  assert(hex, `Expected a six-digit hex color, got: ${value}`);
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function relativeLuminance(value) {
  return parseHexColor(value)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce(
      (luminance, channel, index) => luminance + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightTokens = parseDeclarations(extractBlock(":root,\n[data-theme='light']"));
const darkTokens = parseDeclarations(extractBlock("[data-theme='dark']"));
const sharedTokens = parseDeclarations(
  extractBlock(
    '/* Canonical shared tokens and compatibility aliases for the current component surface. */',
  ),
);
const themeTokens = parseDeclarations(extractBlock('@theme inline'));

const lockedColorValues = {
  canvas: ['#f7f7f4', '#111310'],
  surface: ['#ffffff', '#171a16'],
  'surface-subtle': ['#f1f1ec', '#20231e'],
  'surface-raised': ['#ffffff', '#252823'],
  'surface-emphasis': ['#ecece6', '#2d312b'],
  'surface-inverse': ['#121417', '#f4f5ef'],
  foreground: ['#121417', '#f4f5ef'],
  'foreground-secondary': ['#454b46', '#c9cdc5'],
  'foreground-muted': ['#626862', '#a7ada4'],
  'foreground-on-inverse': ['#ffffff', '#111310'],
  'border-subtle': ['#e3e4de', '#30342e'],
  border: ['#c7cac3', '#454b43'],
  'border-strong': ['#858a85', '#8d958a'],
  primary: ['#121417', '#f4f5ef'],
  'primary-hover': ['#282b2e', '#ffffff'],
  'primary-active': ['#050607', '#dfe2da'],
  'primary-foreground': ['#ffffff', '#111310'],
  secondary: ['#ffffff', '#20231e'],
  'secondary-hover': ['#f1f1ec', '#2a2e28'],
  'secondary-foreground': ['#121417', '#f4f5ef'],
  accent: ['#ffcc00', '#ffd528'],
  'accent-hover': ['#f2c200', '#ffe052'],
  'accent-active': ['#e3b600', '#edc51e'],
  'accent-soft': ['#fff4bf', '#342d0d'],
  'accent-foreground': ['#121417', '#111310'],
  success: ['#1f7a4d', '#6bc395'],
  'success-soft': ['#e9f6ef', '#173427'],
  'success-foreground': ['#145236', '#b8efd0'],
  warning: ['#b85f0b', '#f1a453'],
  'warning-soft': ['#fff1df', '#3c2914'],
  'warning-foreground': ['#743a06', '#ffd7aa'],
  danger: ['#b8322a', '#ef817a'],
  'danger-soft': ['#fcebea', '#3b1d1b'],
  'danger-foreground': ['#84221d', '#ffc6c2'],
  info: ['#2867b2', '#7fb4ff'],
  'info-soft': ['#eaf2fb', '#172b45'],
  'info-foreground': ['#1f4f86', '#c6ddff'],
  'focus-ring': ['#1f6feb', '#7fb4ff'],
  'focus-ring-offset': ['#ffffff', '#111310'],
  'disabled-surface': ['#ecece7', '#252823'],
  'disabled-foreground': ['#787d77', '#7f857c'],
  'overlay-backdrop': ['rgb(18 20 23 / 0.48)', 'rgb(0 0 0 / 0.68)'],
  'chart-primary': ['#121417', '#f4f5ef'],
  'chart-secondary': ['#7b817a', '#9da49a'],
  'chart-accent': ['#d8ad00', '#ffd528'],
  'chart-grid': ['#dedfd9', '#343830'],
  'chart-axis': ['#626862', '#a7ada4'],
  'chart-tooltip': ['#ffffff', '#252823'],
  'chart-tooltip-foreground': ['#121417', '#f4f5ef'],
  'surface-hover': ['#f1f1ec', '#2a2e28'],
};

const lockedSharedValues = {
  'font-sans': "'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, sans-serif",
  'font-display': 'var(--font-sans)',
  'font-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  'text-xs': '0.75rem',
  'text-sm': '0.875rem',
  'text-base': '1rem',
  'text-lg': '1.125rem',
  'text-xl': '1.375rem',
  'text-2xl': '1.75rem',
  'text-3xl': '2.25rem',
  'text-4xl': '3rem',
  'text-hero': 'clamp(2.75rem, 6vw, 5rem)',
  'leading-tight': '1.05',
  'leading-heading': '1.15',
  'leading-normal': '1.5',
  'leading-relaxed': '1.65',
  'font-weight-normal': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',
  'font-weight-bold': '700',
  'font-weight-extrabold': '800',
  'spacing-1': '0.25rem',
  'spacing-2': '0.5rem',
  'spacing-3': '0.75rem',
  'spacing-4': '1rem',
  'spacing-5': '1.25rem',
  'spacing-6': '1.5rem',
  'spacing-8': '2rem',
  'spacing-10': '2.5rem',
  'spacing-12': '3rem',
  'spacing-16': '4rem',
  'spacing-20': '5rem',
  'spacing-24': '6rem',
  'spacing-28': '7rem',
  'spacing-32': '8rem',
  'radius-xs': '0.5rem',
  'radius-sm': '0.625rem',
  'radius-md': '0.75rem',
  'radius-lg': '1rem',
  'radius-xl': '1.5rem',
  'radius-pill': '999px',
  'control-height-sm': '2.5rem',
  'control-height-md': '2.75rem',
  'control-height-lg': '3rem',
  'public-max-width': '80rem',
  'owner-max-width': '90rem',
  'owner-sidebar-width': '15rem',
  'gutter-compact': '1.25rem',
  'gutter-medium': '2rem',
  'gutter-wide': '2.5rem',
  'motion-fast': '140ms',
  'motion-normal': '180ms',
  'motion-overlay': '220ms',
  'motion-ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'shadow-xs': '0 1px 1px rgb(18 20 23 / 0.05)',
  'shadow-control': '0 1px 2px rgb(18 20 23 / 0.08)',
  'shadow-hover': '0 3px 8px rgb(18 20 23 / 0.09)',
  'shadow-popover': '0 12px 32px rgb(0 0 0 / 0.2)',
  'shadow-dialog': '0 24px 64px rgb(0 0 0 / 0.28)',
};

for (const [token, [light, dark]] of Object.entries(lockedColorValues)) {
  assert.equal(lightTokens[token], light, `light ${token}`);
  assert.equal(darkTokens[token], dark, `dark ${token}`);
}

for (const [token, value] of Object.entries(lockedSharedValues)) {
  assert.equal(sharedTokens[token], value, `shared ${token}`);
}

for (const token of [
  'canvas',
  'surface',
  'surface-hover',
  'foreground',
  'primary',
  'accent',
  'success-soft',
  'warning-soft',
  'danger-soft',
  'info-soft',
  'focus-ring',
  'disabled-surface',
  'chart-tooltip',
]) {
  assert.equal(themeTokens[`color-${token}`], `var(--${token})`, `theme color ${token}`);
}

for (const token of [
  'font-sans',
  'font-display',
  'font-mono',
  'text-base',
  'leading-normal',
  'font-weight-semibold',
  'spacing-4',
  'radius-md',
  'shadow-control',
  'shadow-popover',
]) {
  assert.equal(themeTokens[token], `var(--${token})`, `theme alias ${token}`);
}

const declarations = new Set(
  [...stylesheet.matchAll(/--([a-z0-9-]+)\s*:/g)].map(([, token]) => token),
);
const references = new Set(
  [...stylesheet.matchAll(/var\(\s*--([a-z0-9-]+)/g)].map(([, token]) => token),
);
assert.deepEqual(
  [...references].filter((token) => !declarations.has(token)),
  [],
  'every referenced custom property must be declared',
);

const readablePairs = [
  ['foreground', 'surface'],
  ['foreground-secondary', 'surface'],
  ['foreground-muted', 'surface'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['success-foreground', 'success-soft'],
  ['warning-foreground', 'warning-soft'],
  ['danger-foreground', 'danger-soft'],
  ['info-foreground', 'info-soft'],
  ['disabled-foreground', 'disabled-surface'],
  ['chart-tooltip-foreground', 'chart-tooltip'],
];

for (const [foreground, background] of readablePairs) {
  assert(
    contrastRatio(resolveColor(foreground, lightTokens), resolveColor(background, lightTokens)) >=
      3,
    `light ${foreground} on ${background} must have readable contrast`,
  );
  assert(
    contrastRatio(resolveColor(foreground, darkTokens), resolveColor(background, darkTokens)) >= 3,
    `dark ${foreground} on ${background} must have readable contrast`,
  );
}

console.log(`Design token contract passed for ${stylesheetPath}`);
