# Canonical asset provenance

The five listed active facility images are local WebP derivatives of the
Unsplash photographs supplied for this task. They are committed to the
repository so the public experience does not depend on a remote image host.

| Facility asset            | Supplied file                             | Photographer   | Source                                                                                |
| ------------------------- | ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `central-corrientes.webp` | `jefferson-sees-tB_A2Fvt4Jo-unsplash.jpg` | Jefferson Sees | https://unsplash.com/photos/a-parking-lot-filled-with-lots-of-parked-cars-tB_A2Fvt4Jo |
| `palermo-plaza.webp`      | `ivana-cajina-WPVtT0MEM00-unsplash.jpg`   | Ivana Cajina   | https://unsplash.com/photos/aerial-photography-of-cars-on-parking-lot-WPVtT0MEM00     |
| `recoleta-patio.webp`     | `erik-mclean-lmr_RXwj8WU-unsplash.jpg`    | Erik Mclean    | https://unsplash.com/photos/assorted-car-parked-on-parking-lot-lmr_RXwj8WU            |
| `puerto-madero-dock.webp` | `erik-mclean-XlMLN8v1f-w-unsplash.jpg`    | Erik Mclean    | https://unsplash.com/photos/cars-parked-on-parking-lot-during-daytime-XlMLN8v1f-w     |
| `belgrano-norte.webp`     | `m-vMneecAwo34-unsplash.jpg`              | m              | https://unsplash.com/photos/cars-parked-on-parking-lot-during-daytime-vMneecAwo34     |

The source photographs were downloaded on 2026-09-16. Each derivative is
1600 by 1200 pixels, center-cropped to the public 4:3 media contract, and
encoded as WebP with FFmpeg libwebp at quality 82 and compression level 6.
Source metadata was removed from the derivatives. The interface uses
`object-fit: cover` for the 16:10 detail slot, so the same local asset serves
both public media contexts.

The paused and unlisted `san-telmo-mercado.svg` asset remains project-owned
original artwork as an internal fallback. It is not eligible for the public
directory and can be replaced when a sixth source image is supplied.

All source photographs are used under the Unsplash License:
https://unsplash.com/license
