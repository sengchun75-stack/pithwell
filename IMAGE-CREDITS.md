# Image credits

| File | What it is | Source | Licence |
|---|---|---|---|
| `docs/img/disc-640.webp`, `disc-900.webp`, `disc-1400.webp`, `disc-2200.webp` | The hero section, resized to four widths and colour-graded (saturation down 16%, brightness down 4%, slight contrast lift). | Photograph "A close up of a tree stump with a circular pattern" by Haberdoedas, Unsplash, published 2025-02-01, 5381 x 5381 px. https://unsplash.com/photos/a-close-up-of-a-tree-stump-with-a-circular-pattern-kAIB9RXFdyM | Unsplash Licence (https://unsplash.com/license): free for commercial use, no attribution required. Credited here and on the home page anyway. |
| `docs/img/loupe.webp` | A 720 x 480 pixel crop of the same photograph at native resolution, graded the same way. | As above. | As above. |
| `docs/img/banner-1.webp`, `banner-2.webp`, `banner-3.webp` | Three regions of the same photograph at native resolution (near the pith, the north-east rings, the south arcs), dimmed to 60% and resized, used as backdrops behind the article headers and the closing panel. | As above. | As above. |
| `docs/img/hero-bg.webp` | The whole section, softened and dimmed to half brightness, used as the home hero backdrop. | As above. | As above. |
| `docs/img/sec-1.webp` to `sec-19.webp` | Nineteen different crops of the same photograph at native resolution, one behind each content section on the four pages. They differ in zoom, rotation, mirroring and tint (warm, desaturated, or a green tint taken from the site's accent colour), are dimmed to half brightness and are made by `tools/sections.mjs`. | As above. | As above. |
| `docs/video/loop.webm`, `docs/video/loop.mp4`, `docs/img/wood-still.webp` | A 12 second seamless loop, 1920 x 1080, made by moving a virtual camera slowly around the pith of the same photograph (one orbit and a 4.5% zoom), dimmed to half brightness, and recorded with `tools/loop.mjs`. The still is its first frame. Used as the fixed backdrop behind every page. | As above. | As above. The clip containers carry only a generic `Chrome` muxer tag. |
| `docs/img/rings.png` | A ring-number map of the frame: for each point, which ring it belongs to. Measured from the photograph by `tools/bake.mjs`. | Derived from the photograph. | Derivative of the photograph under the Unsplash Licence. |
| `docs/img/og.jpg`, `logo-512.png`, `apple-touch-icon.png`, `favicon.svg` | Social card, logo mark and icons. The card uses a frame captured from the site's own renderer (`tools/og-disc.webp`). | Made in this project from the photograph and the fonts below (`tools/social.html`). | Same as their sources. |

The photograph is the only picture on the site. The one moving background is a camera move over that photograph, not filmed or generated footage, and there is no generated imagery and no hand-built geometry. The tinted, contoured view of the section is computed from the photograph and its ring map at run time, not drawn.

Every image has been re-encoded from the source JPEG, so no EXIF, XMP or C2PA data from the original file is carried over.

The skeleton plot on the crossdating page is drawn from invented numbers and is labelled as an illustration.
