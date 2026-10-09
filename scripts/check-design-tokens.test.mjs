import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertContrast,
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
