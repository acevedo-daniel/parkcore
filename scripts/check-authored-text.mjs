#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const forbiddenCodePoint = 0x2014;
const forbiddenCharacter = String.fromCodePoint(forbiddenCodePoint);

const scannedRoots = new Set(['.github', 'apps', 'docs', 'docs-local', 'packages', 'scripts']);

const excludedDirectoryNames = new Set([
  '.git',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'vendor',
]);

const excludedFileNames = new Set([
  'npm-shrinkwrap.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);

const binaryExtensions = new Set([
  '.7z',
  '.avi',
  '.bin',
  '.bmp',
  '.class',
  '.dll',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.mp4',
  '.pdf',
  '.png',
  '.so',
  '.tar',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

function isExcluded(relativePath, entry) {
  const pathParts = relativePath.split(path.sep);
  const normalizedParts = pathParts.map((part) => part.toLowerCase());
  const fileName = pathParts.at(-1) ?? '';
  const lowerFileName = fileName.toLowerCase();

  if (normalizedParts.some((part) => excludedDirectoryNames.has(part))) {
    return true;
  }

  if (entry.isDirectory()) {
    return false;
  }

  if (excludedFileNames.has(lowerFileName)) {
    return true;
  }

  if (
    lowerFileName === 'openapi.json' ||
    lowerFileName.endsWith('.generated.json') ||
    lowerFileName.endsWith('.generated.js') ||
    lowerFileName.endsWith('.generated.ts') ||
    lowerFileName.endsWith('.generated.tsx') ||
    lowerFileName.endsWith('.map') ||
    lowerFileName.endsWith('.snap')
  ) {
    return true;
  }

  return binaryExtensions.has(path.extname(lowerFileName));
}

function isScannedRoot(relativePath) {
  const [rootName] = relativePath.split(path.sep);
  return scannedRoots.has(rootName);
}

async function collectFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(repositoryRoot, relativePath);

    if (entry.isSymbolicLink() || isExcluded(relativePath, entry)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
      continue;
    }

    if (entry.isFile() && (relativeDirectory === '' || isScannedRoot(relativePath))) {
      files.push({ absolutePath, relativePath });
    }
  }

  return files;
}

async function findViolations() {
  const files = await collectFiles(repositoryRoot);
  const violations = [];

  for (const file of files) {
    const content = await readFile(file.absolutePath);

    if (content.includes(0)) {
      continue;
    }

    const text = content.toString('utf8');
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (line.includes(forbiddenCharacter)) {
        violations.push(
          `${file.relativePath.split(path.sep).join('/')}:${index + 1}: U+2014 em dash`,
        );
      }
    });
  }

  return violations;
}

const violations = await findViolations();

if (violations.length > 0) {
  console.error('Authored text check failed:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exitCode = 1;
} else {
  console.log('Authored text check passed.');
}
