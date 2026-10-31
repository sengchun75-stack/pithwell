# Pithwell

A concept website for a fictional tree-ring dating studio. The brand is fictional; the dendrochronology on the pages and the sources cited for it are real.

The home page reads one photographed tree section from its newest ring to its pith as you scroll. A ring-number map measured from the photograph drives a small WebGL2 renderer; nothing in the picture is drawn by hand.

## Layout

- `docs/` is the whole site: static HTML, one stylesheet, three small scripts, self-hosted fonts and images. Nothing else is served.
- `tools/` holds the offline pieces: `bake.mjs` (photograph to ring map and image sizes), `pages.mjs` (writes the pages, sitemap, robots, llms.txt and headers), `check.mjs` (static checks), `social.mjs` (social card and icons), `loop.mjs` (the looping wood backdrop), `sections.mjs` (the per-section backdrops).
- `IMAGE-CREDITS.md` and `LICENSES.md` record where every image, font and figure comes from.

## Working on it

There is no build step and no package manifest. To change copy, edit `tools/pages.mjs` and run:

```
node tools/pages.mjs
node tools/check.mjs
```

`bake.mjs`, `social.mjs`, `sections.mjs` and `loop.mjs` need `sharp` and `playwright-core` installed next to a working copy; see the header of each file. Ring figures on the pages come from `tools/ring-data.json`, so change them there.

## Hosting

Any static host that can set response headers will do. `docs/_headers` carries the policy in Cloudflare Pages format.
