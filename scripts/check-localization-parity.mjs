#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const catalogDirectory = path.join(repositoryRoot, 'apps', 'web', 'src', 'locales');
const localeFiles = {
  'es-AR': path.join(catalogDirectory, 'es-AR.json'),
  'en-US': path.join(catalogDirectory, 'en-US.json'),
};

export function flattenCatalogKeys(catalog, prefix = '') {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new TypeError(`Catalog at ${prefix || '<root>'} must be an object.`);
  }

  const keys = [];
  for (const [key, value] of Object.entries(catalog)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else {
      keys.push(...flattenCatalogKeys(value, fullKey));
    }
  }
  return keys;
}

export function compareCatalogKeys(catalogs) {
  const keySets = new Map(
    Object.entries(catalogs).map(([locale, catalog]) => [
      locale,
      new Set(flattenCatalogKeys(catalog).sort()),
    ]),
  );
  const referenceKeys = new Set(keySets.values().next().value ?? []);
  const differences = [];

  for (const [locale, keys] of keySets) {
    const missing = [...referenceKeys].filter((key) => !keys.has(key)).sort();
    const extra = [...keys].filter((key) => !referenceKeys.has(key)).sort();
    if (missing.length > 0 || extra.length > 0) differences.push({ locale, missing, extra });
  }

  return differences;
}

async function readCatalogs() {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(localeFiles).map(async ([locale, filePath]) => [
        locale,
        JSON.parse(await readFile(filePath, 'utf8')),
      ]),
    ),
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    const catalogs = await readCatalogs();
    const differences = compareCatalogKeys(catalogs);
    if (differences.length > 0) {
      console.error('Localization catalog parity check failed:');
      for (const difference of differences) {
        if (difference.missing.length > 0) {
          console.error(`- ${difference.locale} is missing: ${difference.missing.join(', ')}`);
        }
        if (difference.extra.length > 0) {
          console.error(`- ${difference.locale} has extra keys: ${difference.extra.join(', ')}`);
        }
      }
      process.exitCode = 1;
    } else {
      console.log(`Localization catalog parity passed for ${Object.keys(catalogs).join(', ')}.`);
    }
  } catch (error) {
    console.error('Localization catalog parity check failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
