import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(
  repositoryRoot,
  process.env.PARKCORE_CANONICAL_SOURCE_DIR ?? 'temp',
);
const outputDirectory = resolve(
  repositoryRoot,
  process.env.PARKCORE_CANONICAL_OUTPUT_DIR ?? 'apps/web/public/assets/canonical',
);
const ffmpegBinary = process.env.FFMPEG_PATH ?? 'ffmpeg';
const width = 1600;
const height = 1200;

const assets = [
  {
    source: 'ChatGPT Image Sep 17, 2026, 07_21_12 PM.png',
    output: 'central-corrientes.webp',
  },
  {
    source: 'ChatGPT Image Sep 17, 2026, 07_19_38 PM.png',
    output: 'palermo-plaza.webp',
  },
  {
    source: 'ChatGPT Image Sep 17, 2026, 07_27_09 PM.png',
    output: 'recoleta-patio.webp',
  },
  {
    source: 'ChatGPT Image Sep 17, 2026, 07_43_12 PM.png',
    output: 'puerto-madero-dock.webp',
  },
  {
    source: 'ChatGPT Image Sep 17, 2026, 03_43_27 AM.png',
    output: 'belgrano-norte.webp',
  },
];

mkdirSync(outputDirectory, { recursive: true });

for (const asset of assets) {
  const sourcePath = resolve(sourceDirectory, asset.source);
  const outputPath = resolve(outputDirectory, asset.output);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing canonical asset source: ${sourcePath}`);
  }

  const result = spawnSync(
    ffmpegBinary,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      sourcePath,
      '-vf',
      `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      '-frames:v',
      '1',
      '-an',
      '-map_metadata',
      '-1',
      '-c:v',
      'libwebp',
      '-q:v',
      '82',
      '-compression_level',
      '6',
      outputPath,
    ],
    { stdio: 'inherit' },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed while generating ${asset.output}`);
  }

  console.log(`Generated ${asset.output}`);
}
