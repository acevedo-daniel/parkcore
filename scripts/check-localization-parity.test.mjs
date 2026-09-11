import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareCatalogKeys, flattenCatalogKeys } from './check-localization-parity.mjs';

test('flattens nested catalog keys', () => {
  assert.deepEqual(flattenCatalogKeys({ appearance: { theme: { dark: 'Dark' } } }), [
    'appearance.theme.dark',
  ]);
});

test('reports missing and extra nested keys', () => {
  assert.deepEqual(
    compareCatalogKeys({
      'es-AR': { common: { retry: 'Reintentar' }, nested: { value: 'Valor' } },
      'en-US': { common: { retry: 'Try again' }, nested: { other: 'Other' } },
    }),
    [
      {
        extra: ['nested.other'],
        locale: 'en-US',
        missing: ['nested.value'],
      },
    ],
  );
});
