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

export function getCatalogValues(catalog, prefix = '') {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new TypeError(`Catalog at ${prefix || '<root>'} must be an object.`);
  }

  const values = new Map();
  for (const [key, value] of Object.entries(catalog)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      values.set(fullKey, value);
    } else {
      for (const [nestedKey, nestedValue] of getCatalogValues(value, fullKey)) {
        values.set(nestedKey, nestedValue);
      }
    }
  }
  return values;
}

export function getInterpolationPlaceholders(value) {
  return [...value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((match) => match[1]).sort();
}

export function compareCatalogKeys(catalogs) {
  const valueMaps = new Map(
    Object.entries(catalogs).map(([locale, catalog]) => [locale, getCatalogValues(catalog)]),
  );
  const keySets = new Map(
    [...valueMaps].map(([locale, values]) => [locale, new Set(values.keys())]),
  );
  const referenceKeys = new Set(keySets.values().next().value ?? []);
  const referenceValues = valueMaps.values().next().value ?? new Map();
  const differences = [];

  for (const [locale, keys] of keySets) {
    const missing = [...referenceKeys].filter((key) => !keys.has(key)).sort();
    const extra = [...keys].filter((key) => !referenceKeys.has(key)).sort();
    const blank = [...(valueMaps.get(locale) ?? [])]
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key)
      .sort();
    const placeholderMismatch = [...referenceKeys]
      .filter((key) => keys.has(key))
      .filter((key) => {
        const referencePlaceholders = getInterpolationPlaceholders(referenceValues.get(key) ?? '');
        const localePlaceholders = getInterpolationPlaceholders(
          valueMaps.get(locale)?.get(key) ?? '',
        );
        return JSON.stringify(referencePlaceholders) !== JSON.stringify(localePlaceholders);
      })
      .map((key) => ({
        key,
        expected: getInterpolationPlaceholders(referenceValues.get(key) ?? ''),
        received: getInterpolationPlaceholders(valueMaps.get(locale)?.get(key) ?? ''),
      }));
    if (
      missing.length > 0 ||
      extra.length > 0 ||
      blank.length > 0 ||
      placeholderMismatch.length > 0
    ) {
      differences.push({ locale, missing, extra, blank, placeholderMismatch });
    }
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
        if (difference.blank.length > 0) {
          console.error(`- ${difference.locale} has blank values: ${difference.blank.join(', ')}`);
        }
        for (const mismatch of difference.placeholderMismatch) {
          console.error(
            `- ${difference.locale} has mismatched placeholders for ${mismatch.key}: expected ${mismatch.expected.join(', ') || '<none>'}, received ${mismatch.received.join(', ') || '<none>'}`,
          );
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
