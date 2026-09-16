#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const distDirectory = path.join(repositoryRoot, 'apps', 'web', 'dist');
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.svg',
  '.txt',
  '.webmanifest',
]);
const privateRuntimeNames = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGINS',
  'SEED_OWNER_EMAIL',
  'SEED_OWNER_PASSWORD',
  'JWT_EXPIRES_IN',
  'AUTH_RATE_LIMIT_MAX',
  'AUTH_RATE_LIMIT_WINDOW_MS',
  'DEMO_CREATION_RATE_LIMIT_MAX',
  'DEMO_CREATION_RATE_LIMIT_WINDOW_MS',
  'DEMO_CLEANUP_BATCH_SIZE',
  'DEMO_RESET_RATE_LIMIT_MAX',
  'DEMO_RESET_RATE_LIMIT_WINDOW_MS',
  'LOG_LEVEL',
  'LOG_PRETTY',
  'ENABLE_API_DOCS',
];
const privateRuntimeValues = [
  process.env.DATABASE_URL,
  process.env.JWT_SECRET,
  process.env.SEED_OWNER_EMAIL,
  process.env.SEED_OWNER_PASSWORD,
  process.env.PARKCORE_ARTIFACT_PRIVATE_VALUES,
]
  .flatMap((value) => value?.split(/[\r\n,]+/) ?? [])
  .map((value) => value.trim())
  .filter(Boolean);
const requiredRouteFragments = [
  'landing-route',
  'parking-catalog-route',
  'parking-detail-route',
  'owner-overview-route',
  'owner-parking-overview-route',
];
const canonicalAssetNames = [
  'belgrano-norte.svg',
  'central-corrientes.svg',
  'palermo-plaza.svg',
  'puerto-madero-dock.svg',
  'recoleta-patio.svg',
  'san-telmo-mercado.svg',
];

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function displayPath(value) {
  return normalizePath(path.relative(repositoryRoot, value));
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const fileStats = await stat(absolutePath);
    files.push({
      absolutePath,
      normalizedPath: normalizePath(path.relative(distDirectory, absolutePath)),
      size: fileStats.size,
    });
  }

  return files;
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} bytes`;
}

try {
  const distStats = await stat(distDirectory).catch(() => null);

  if (!distStats?.isDirectory()) {
    throw new Error(
      'apps/web/dist does not exist. Run the web build before checking its artifact.',
    );
  }

  const files = await collectFiles(distDirectory);
  const javascriptAssets = files.filter(
    (file) => file.normalizedPath.startsWith('assets/') && file.normalizedPath.endsWith('.js'),
  );
  const routeChunks = javascriptAssets.filter((file) =>
    requiredRouteFragments.some((fragment) => file.normalizedPath.includes(fragment)),
  );
  const missingRouteFragments = requiredRouteFragments.filter(
    (fragment) => !routeChunks.some((file) => file.normalizedPath.includes(fragment)),
  );

  if (missingRouteFragments.length > 0) {
    throw new Error(`Missing route chunks: ${missingRouteFragments.join(', ')}`);
  }

  const canonicalAssets = canonicalAssetNames.map((assetName) => {
    const normalizedPath = `assets/canonical/${assetName}`;
    return files.find((file) => file.normalizedPath === normalizedPath);
  });
  const missingCanonicalAssets = canonicalAssetNames.filter(
    (assetName) =>
      !canonicalAssets.some((file) => file?.normalizedPath === `assets/canonical/${assetName}`),
  );

  if (missingCanonicalAssets.length > 0) {
    throw new Error(`Missing canonical assets: ${missingCanonicalAssets.join(', ')}`);
  }

  const violations = [];

  for (const file of canonicalAssets) {
    if (!file) continue;

    const content = await readFile(file.absolutePath, 'utf8');
    if (!/<svg\b[^>]*\bviewBox=["']0 0 640 360["']/i.test(content)) {
      violations.push(`${file.normalizedPath} must preserve the canonical 640 by 360 viewBox`);
    }
    if (
      /<image\b|(?:href|xlink:href)=["'](?:data:|https?:\/\/|\/\/)|url\(\s*(?:data:|https?:\/\/|\/\/)/i.test(
        content,
      )
    ) {
      violations.push(`${file.normalizedPath} must not reference external or embedded media`);
    }
  }

  for (const file of files) {
    if (!textExtensions.has(path.extname(file.absolutePath).toLowerCase())) {
      continue;
    }

    const content = await readFile(file.absolutePath, 'utf8');

    for (const runtimeName of privateRuntimeNames) {
      if (content.includes(runtimeName)) {
        violations.push(`${file.normalizedPath} contains ${runtimeName}`);
      }
    }

    for (const runtimeValue of privateRuntimeValues) {
      if (content.includes(runtimeValue)) {
        violations.push(`${file.normalizedPath} contains a private runtime value`);
      }
    }

    if (/postgres(?:ql)?:\/\//i.test(content)) {
      violations.push(`${file.normalizedPath} contains a PostgreSQL connection string`);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Web build artifact contract failed:\n${violations.join('\n')}`);
  }

  const javascriptBytes = javascriptAssets.reduce((total, file) => total + file.size, 0);

  console.log('Web build artifact check passed.');
  console.log(
    `JavaScript assets: ${javascriptAssets.length} files, ${formatBytes(javascriptBytes)} total`,
  );
  console.log('Route chunks:');
  for (const file of routeChunks.sort((left, right) =>
    left.normalizedPath.localeCompare(right.normalizedPath),
  )) {
    console.log(`- ${file.normalizedPath} (${formatBytes(file.size)})`);
  }
  console.log('Canonical assets:');
  for (const file of canonicalAssets) {
    console.log(`- ${file.normalizedPath} (${formatBytes(file.size)})`);
  }
} catch (error) {
  console.error('Web build artifact check failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
