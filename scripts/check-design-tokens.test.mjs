import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertContrast,
  findProductSourceViolations,
  findStylesheetViolations,
  oklchToLinearSrgb,
  parseOklch,
  resolveColor,
} from './check-design-tokens.mjs';

test('parses OKLCH and converts black and white to linear sRGB', () => {
  assert.deepEqual(parseOklch('oklch(0.5 0.1 90 / 0.5)'), {
    lightness: 0.5,
    chroma: 0.1,
    hue: 90,
    alpha: 0.5,
  });

  const black = oklchToLinearSrgb('oklch(0 0 0)');
  const white = oklchToLinearSrgb('oklch(1 0 0)');
  for (const channel of black) assert.ok(Math.abs(channel) < 1e-9);
  for (const channel of white) assert.ok(Math.abs(channel - 1) < 1e-9);
});

test('resolves color aliases and rejects circular aliases', () => {
  const tokens = { foreground: 'oklch(0.2 0.01 250)', alias: 'var(--foreground)' };
  assert.equal(resolveColor('alias', tokens), tokens.foreground);
  assert.throws(
    () => resolveColor('loop-a', { 'loop-a': 'var(--loop-b)', 'loop-b': 'var(--loop-a)' }),
    {
      message: 'Circular color alias: loop-a',
    },
  );
});

test('rejects a color pair below its required contrast', () => {
  assert.throws(
    () =>
      assertContrast(
        'foreground',
        'background',
        { foreground: 'oklch(1 0 0)', background: 'oklch(1 0 0)' },
        4.5,
        'white on white',
      ),
    /white on white must meet 4\.5:1 contrast/,
  );
});

test('reports a missing token during alias resolution', () => {
  assert.throws(() => resolveColor('missing', {}), /Missing color token: missing/);
});

test('rejects arbitrary values, raw colors, and palette utilities but keeps legal bracket variants', () => {
  const source = `
    const classes = [
      'text-[11px]',
      'tracking-[0.1em]',
      'rounded-[var(--radius-md)]',
      'w-(--radix-popover-trigger-width)',
      '[mask-type:luminance]',
      'bg-primary/[0.5]',
      'bg-white',
      '#ffcc00',
      'data-[state=open]:bg-accent',
      'has-[>[data-slot=field]]:gap-2',
      "[&_svg:not([class*='size-'])]:size-4",
      'aspect-16/10',
      'bg-primary/90',
    ];
    const selector = '[contenteditable="true"]';
  `;

  assert.deepEqual(
    findProductSourceViolations(source, 'src/routes/public/landing-route.tsx').map(
      ({ className }) => className,
    ),
    [
      'text-[11px]',
      'tracking-[0.1em]',
      'rounded-[var(--radius-md)]',
      'w-(--radix-popover-trigger-width)',
      '[mask-type:luminance]',
      'bg-primary/[0.5]',
      'bg-white',
      '#ffcc00',
    ],
  );
});

test('allows raw theme colors only in the theme-color module', () => {
  assert.deepEqual(
    findProductSourceViolations("const color = '#ffcc00';", 'src/app/theme-color.ts'),
    [],
  );
  assert.deepEqual(
    findProductSourceViolations("const color = 'oklch(0.5 0.1 90)';", 'src/app/theme.ts').map(
      ({ className }) => className,
    ),
    ['oklch(0.5'],
  );
});

test('allows CSS color tokens in theme declarations and tokenized style properties', () => {
  const stylesheet = `
    :root,
    [data-theme='light'] {
      --background: oklch(1 0 0);
      --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.1);
    }
    [data-theme='dark'] {
      --background: oklch(0 0 0);
    }
    .card {
      color: var(--foreground);
      font-size: var(--text-base);
      letter-spacing: var(--tracking-body);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
  `;

  assert.deepEqual(findStylesheetViolations(stylesheet), []);
});

test('reports CSS colors outside theme tokens and un-tokenized type, radius, and shadow values', () => {
  const stylesheet = `
    .card {
      color: #fff;
      background: white;
      font-size: 12px;
      letter-spacing: 0.1em;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
    }
  `;

  assert.deepEqual(
    findStylesheetViolations(stylesheet).map(({ className }) => className),
    [
      'color: #fff',
      'background: white',
      'font-size: 12px',
      'letter-spacing: 0.1em',
      'border-radius: 8px',
      'box-shadow: 0 1px 2px rgb(0 0 0 / 0.1)',
    ],
  );
});
