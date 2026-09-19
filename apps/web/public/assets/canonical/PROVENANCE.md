# Canonical asset provenance

The five listed active facility images are local WebP derivatives of the
temporary PNG files supplied for this task. The derivatives are committed so
the public experience does not depend on a remote image host. The temporary
source files are intentionally excluded from version control and are not
required at runtime.

| Facility asset            | Supplied source file                          |
| ------------------------- | --------------------------------------------- |
| `central-corrientes.webp` | `ChatGPT Image Sep 17, 2026, 07_21_12 PM.png` |
| `palermo-plaza.webp`      | `ChatGPT Image Sep 17, 2026, 07_19_38 PM.png` |
| `recoleta-patio.webp`     | `ChatGPT Image Sep 17, 2026, 07_27_09 PM.png` |
| `puerto-madero-dock.webp` | `ChatGPT Image Sep 17, 2026, 07_43_12 PM.png` |
| `belgrano-norte.webp`     | `ChatGPT Image Sep 17, 2026, 03_43_27 AM.png` |

When the source files are available under `temp/`, regenerate all five
derivatives from the repository root with `pnpm assets:canonical`. The mapping
and normalization settings live in
`scripts/generate-canonical-assets.mjs`, so a future replacement can update
the source manifest without changing the canonical runtime filenames.

Each derivative is 1600 by 1200 pixels, center-cropped to the public 4:3
media contract, and encoded as WebP with FFmpeg libwebp at quality 82 and
compression level 6. Source metadata is removed. The interface uses
`object-fit: cover` for the 16:10 detail slot, so the same local asset serves
both public media contexts.

The paused and unlisted `san-telmo-mercado.svg` asset remains project-owned
original artwork as an internal fallback. It is not eligible for the public
directory and can be replaced when a sixth source image is supplied.
