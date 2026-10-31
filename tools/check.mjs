/* Static checks over docs/: metadata, headings, alt text, structured data, links,
 * sitemap coverage, inline styles, contrast and stray words. Exits 1 on any failure.
 *
 * usage: node tools/check.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const ORIGIN = 'https://pithwell.pages.dev';
const pages = readdirSync(DOCS).filter(f => f.endsWith('.html'));
const allLazy = [];
const res = []; const ok = (name, c, extra = '') => res.push([c, name + (extra ? ' - ' + extra : '')]);
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
const sitemap = readFileSync(join(DOCS, 'sitemap.xml'), 'utf8');
const urlFor = (f) => f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '');

for (const f of pages) {
  const html = readFileSync(join(DOCS, f), 'utf8'), body = strip(html), is404 = f === '404.html', u = urlFor(f);
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '', d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  ok(`${f}: title 15-60 chars`, t.length >= 15 && t.length <= 60, t.length + '');
  ok(`${f}: description 70-160 chars`, d.length >= 70 && d.length <= 160, d.length + '');
  if (!is404) {
    ok(`${f}: canonical self`, html.includes(`<link rel="canonical" href="${ORIGIN}${u}">`));
    ok(`${f}: in sitemap`, sitemap.includes(`<loc>${ORIGIN}${u}</loc>`));
    for (const og of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'twitter:card', 'twitter:image']) ok(`${f}: ${og}`, html.includes(`"${og}"`));
    ok(`${f}: no noindex`, !/noindex/i.test(html));
  } else ok(`${f}: 404 is noindex`, /content="noindex"/.test(html));
  const h = [...body.matchAll(/<h([1-6])[ >]/g)].map(m => +m[1]);
  ok(`${f}: exactly one h1`, h.filter(x => x === 1).length === 1);
  ok(`${f}: heading order never skips`, h.every((x, i) => i === 0 || x <= h[i - 1] + 1), h.join(''));
  const imgs = [...body.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  ok(`${f}: every img has alt, width, height`, imgs.every(i => (/\balt="[^"]+"/.test(i) || (/\balt=""/.test(i) && /aria-hidden="true"/.test(i))) && /\bwidth="/.test(i) && /\bheight="/.test(i)), imgs.length + ' imgs');
  ok(`${f}: no inline style attribute`, !/\sstyle="/.test(html));
  ok(`${f}: landmarks main, header, nav, footer`, ['<main', '<header', '<nav', '<footer'].every(x => body.includes(x)));
  ok(`${f}: raw HTML carries real text`, plainLen(body) > (is404 ? 200 : 2500), plainLen(body) + ' chars');
  // the stylesheet and scripts are cached for a day, so their URLs must carry a hash of their content
  const hashOf = (...fs) => { const h = createHash('sha256'); for (const x of fs) h.update(readFileSync(join(DOCS, x))); return h.digest('hex').slice(0, 10); };
  ok(`${f}: stylesheet URL carries the current content hash`, html.includes(`href="/css/style.css?v=${hashOf('css/style.css')}"`));
  ok(`${f}: script URLs carry the current content hash`, [...html.matchAll(/src="\/js\/[a-z]+\.js([^"]*)"/g)].every(m => m[1] === `?v=${hashOf('js/main.js', 'js/stage.js', 'js/slide.js', 'js/bg.js')}`));
  // links
  const hrefs = [...body.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  const bad = hrefs.filter(x => x.startsWith('/') && !x.startsWith('//')).map(x => x.split('#')[0].split('?')[0]).filter(x => x && x !== '/' && !target(x));
  ok(`${f}: internal links and assets resolve`, bad.length === 0, bad.join(', '));
  ok(`${f}: external links carry rel noopener`, [...body.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)].every(m => /rel="[^"]*noopener/.test(m[0])));
  const lazy = [...body.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]); allLazy.push(...lazy);
  ok(`${f}: every section backdrop file exists`, lazy.every(x => target(x)), lazy.length + ' backdrops');
  // structured data
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); ok(`${f}: JSON-LD parses`, true); } catch (e) { ok(`${f}: JSON-LD parses`, false, e.message); continue; }
    const types = j['@graph'].map(x => x['@type']);
    ok(`${f}: JSON-LD has WebSite, Organization, BreadcrumbList`, ['WebSite', 'Organization', 'BreadcrumbList'].every(x => types.includes(x)), types.join(','));
    ok(`${f}: JSON-LD has none of the forbidden types`, !/LocalBusiness|PostalAddress|telephone|aggregateRating|Review|Offer|"price"/.test(m[1]));
    const org = j['@graph'].find(x => x['@type'] === 'Organization'); ok(`${f}: Organization is name, url, logo only`, Object.keys(org).filter(k => !k.startsWith('@')).sort((p, q) => p.localeCompare(q)).join() === 'logo,name,url');
    const fq = j['@graph'].find(x => x['@type'] === 'FAQPage');
    if (fq) { const vis = plain(body); ok(`${f}: every FAQ answer is visible on the page`, fq.mainEntity.every(q => vis.includes(q.acceptedAnswer.text.slice(0, 60))), fq.mainEntity.length + ' Q&A'); ok(`${f}: FAQ answers are 40-60 words`, fq.mainEntity.every(q => { const n = q.acceptedAnswer.text.split(/\s+/).length; return n >= 40 && n <= 60; })); }
  }
}
// removes tags in one pass; a regex such as <[^>]+> can backtrack badly on odd input
function stripTags(h, sep = '') {
  let out = '', i = 0;
  while (i < h.length) {
    const a = h.indexOf('<', i);
    if (a < 0) { out += h.slice(i); break; }
    out += h.slice(i, a);
    const b = h.indexOf('>', a);
    if (b < 0) { out += h.slice(a); break; }
    out += sep; i = b + 1;
  }
  return out;
}
function plain(h) { return stripTags(h, ' ').replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); }
function plainLen(h) { return plain(h).length; }
function target(p) { const clean = p.replace(/\/$/, ''); return existsSync(join(DOCS, clean)) && statSync(join(DOCS, clean)).isFile() || existsSync(join(DOCS, clean + '.html')); }

ok('no two sections share a backdrop image', new Set(allLazy).size === allLazy.length && allLazy.length === 19, allLazy.length + ' backdrops, ' + new Set(allLazy).size + ' distinct');

// files
for (const f of ['robots.txt', 'llms.txt', 'sitemap.xml', '_headers', 'img/og.jpg', 'img/favicon.svg', 'img/logo-512.png', 'img/apple-touch-icon.png']) ok(`file ${f} exists`, existsSync(join(DOCS, f)));
const robots = readFileSync(join(DOCS, 'robots.txt'), 'utf8');
ok('robots: allows everything, lists the sitemap', /Allow: \//.test(robots) && !/Disallow/.test(robots) && robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
ok('sitemap: 4 urls with lastmod', (sitemap.match(/<loc>/g) || []).length === 4 && (sitemap.match(/<lastmod>/g) || []).length === 4);

// contrast
const css = readFileSync(join(DOCS, 'css', 'style.css'), 'utf8');
const tok = Object.fromEntries([...css.matchAll(/--([a-z]+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
const lum = (hex) => { const c = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
for (const [fg, bg, min] of [['ink', 'void', 4.5], ['mute', 'void', 4.5], ['cambium', 'void', 4.5], ['ink', 'panel', 4.5], ['mute', 'panel', 4.5], ['cambium', 'panel', 4.5], ['void', 'cambium', 4.5]]) { const r = ratio(tok[fg], tok[bg]); ok(`contrast ${fg} on ${bg} >= ${min}`, r >= min, r.toFixed(1) + ':1'); }

// stray words anywhere that is served
const served = []; (function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : /\.(html|css|js|txt|xml|svg|json)$|_headers$/.test(n) && served.push(p); } })(DOCS);
// built from fragments so this file does not trip the same scan it runs
const parts = ['annal' + 'wood', 'thorn' + 'bury', 'pon' + 'til', 'pis' + 'til', 'cla' + 'ude', 'anthro' + 'pic', 'open' + 'ai', 'chat' + 'gpt', 'copi' + 'lot', 'as an' + ' ai', 'generated' + ' by', 'lorem' + ' ipsum', 'to' + 'do', 'fix' + 'me'];
const words = new RegExp(parts.join('|'), 'i');
const hits = served.filter(p => words.test(readFileSync(p, 'utf8')));
ok('no stray tool, brand or placeholder words in anything served', hits.length === 0, hits.join(', '));

for (const [c, n] of res) console.log((c ? 'PASS ' : 'FAIL ') + n);
const fails = res.filter(r => !r[0]).length; console.log(`\n${res.length - fails}/${res.length} passed`); process.exit(fails ? 1 : 0);
