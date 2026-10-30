# Image credits

| File | What it is | Source | Licence |
|---|---|---|---|
| `docs/img/disc-640.webp`, `disc-900.webp`, `disc-1400.webp`, `disc-2200.webp` | The hero section, resized to four widths and colour-graded (saturation down 16%, brightness down 4%, slight contrast lift). | Photograph "A close up of a tree stump with a circular pattern" by Haberdoedas, Unsplash, published 2025-02-01, 5381 x 5381 px. https://unsplash.com/photos/a-close-up-of-a-tree-stump-with-a-circular-pattern-kAIB9RXFdyM | Unsplash Licence (https://unsplash.com/license): free for commercial use, no attribution required. Credited here and on the home page anyway. |
| `docs/img/loupe.webp` | A 720 x 480 pixel crop of the same photograph at native resolution, graded the same way. | As above. | As above. |
| `docs/img/core-1.webp`, `core-2.webp`, `core-3.webp` | Three narrow strips cut along the radius from the pith to the top of the frame, rotated so the rings stand vertical, like a core sample. Rings 1-20, 10-29 and 19-38. | As above. | As above. |
| `docs/img/rings.png` | A ring-number map of the frame: for each point, which ring it belongs to. Measured from the photograph by `tools/bake.mjs`. | Derived from the photograph. | Derivative of the photograph under the Unsplash Licence. |
| `docs/img/og.jpg`, `logo-512.png`, `apple-touch-icon.png`, `favicon.svg` | Social card, logo mark and icons. The card uses a frame captured from the site's own renderer (`tools/og-disc.webp`). | Made in this project from the photograph and the fonts below (`tools/social.html`). | Same as their sources. |

The photograph is the only picture on the site. There is no video, no generated imagery and no hand-built geometry. The tinted, contoured view of the section is computed from the photograph and its ring map at run time, not drawn.

Every image has been re-encoded from the source JPEG, so no EXIF, XMP or C2PA data from the original file is carried over.

The skeleton plot on the crossdating page is drawn from invented numbers and is labelled as an illustration.
