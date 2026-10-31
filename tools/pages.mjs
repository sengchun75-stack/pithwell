/* Writes every served page, the sitemap, robots.txt, llms.txt and _headers into docs/.
 * Ring figures come from tools/ring-data.json, so the page text, the hero overlay and
 * the structured data cannot drift apart. Answers are checked to 40-60 words.
 *
 * usage: node tools/pages.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const D = JSON.parse(readFileSync(join(ROOT, 'tools', 'ring-data.json'), 'utf8'));
const ORIGIN = 'https://pithwell.pages.dev';
const DATE = '2026-10-30';
const GSC_TAG = '3eEUicYrn6jQ879omto5AQuPLi1-5-p7dmGEGn7CC4Y';   // Search Console ownership tag for the home page; do not remove
const MAILTO = 'mailto:studio@pithwell.example?subject=A%20timber%20sample';
const NORTH = D.northRings, MAXR = D.maxRing;
const PITH = [0.5953, 0.454];   // the visible pith, for the callout and the start of the core line
const BOOT = "document.documentElement.className += ' js';";
const BOOT_HASH = 'sha256-' + createHash('sha256').update(BOOT).digest('base64');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
const plain = (h) => stripTags(h).replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&times;/g, '×').replace(/&rsquo;/g, '’').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const words = (h) => plain(h).split(' ').filter(Boolean).length;
function ans(h, who) { const n = words(h); if (n < 40 || n > 60) throw new Error(`answer of ${n} words (${who})`); return h; }

const SRC = {
  ltrr: ['Laboratory of Tree-Ring Research, University of Arizona: What is dendrochronology?', 'https://ltrr.arizona.edu/about/treerings'],
  ltrrh: ['Laboratory of Tree-Ring Research: lab history', 'https://ltrr.arizona.edu/about/history'],
  itrdb: ['NOAA NCEI: International Tree-Ring Data Bank', 'https://www.ncei.noaa.gov/products/paleoclimatology/tree-ring'],
  wsl: ['WSL Dendro Expo: 1816, the year without a summer', 'https://dendro-expo.wsl.ch/en/a-700-year-old-larch-tells-its-story/1816-the-year-without-a-summer/'],
  pages: ['St. George and Anchukaitis, “On the AD 1815 Tambora eruption and the matter of misplaced tree rings”, PAGES Magazine 23(2), December 2015', 'https://pastglobalchanges.org/sites/default/files/download/docs/magazine/2015-2/PAGESmagazine_2015%282%29_60-61_StGeorge.pdf'],
  esper: ['Esper, Büntgen, Luterbacher and Krusic, “Testing the hypothesis of post-volcanic missing rings in temperature sensitive dendrochronological data”, Dendrochronologia 31 (2013)', 'https://www.climatology.uni-mainz.de/files/2012/03/Esper_2013_Den1.pdf'],
  ads: ['Archaeology Data Service: English Heritage dendrochronology reports', 'https://archaeologydataservice.ac.uk/'],
  slides: ['NOAA Paleo slide set: Tree Rings, Ancient Chronicles of Environmental Change (E. Cook, Lamont-Doherty)', 'https://paleo.ltrr.arizona.edu/slidesets/treering/tree08.txt'],
  photo: ['Photograph: “A close up of a tree stump with a circular pattern” by Haberdoedas, Unsplash, 2025', 'https://unsplash.com/photos/a-close-up-of-a-tree-stump-with-a-circular-pattern-kAIB9RXFdyM'],
};
const srcList = (keys) => `<ul class="sources">\n${keys.map(k => `        <li><a href="${SRC[k][1]}" rel="noopener noreferrer">${esc(SRC[k][0])}</a></li>`).join('\n')}\n      </ul>`;

// ---------- the hero overlay: core line, ticks, callout leaders ----------
function coreSvg() {
  const x0 = (D.northU * 1000);
  let t = '';
  for (const k of D.ticks) {
    const y = (k.v * 1000).toFixed(1), L = k.ring % 10 === 0 ? 18 : k.ring % 5 === 0 ? 12 : 7;
    t += `<line class="tk" data-ring="${k.ring}" x1="${x0.toFixed(1)}" y1="${y}" x2="${(x0 - L).toFixed(1)}" y2="${y}"/>`;
    if (k.ring % 10 === 0) t += `<text class="lbl" x="${(x0 - L - 7).toFixed(1)}" y="${(k.v * 1000 + 4).toFixed(1)}" text-anchor="end">${k.ring}</text>`;
  }
  const ringY = (n) => (D.ticks[n - 1].v * 1000).toFixed(1);
  return `<svg class="over" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
        <line class="core" x1="${(PITH[0] * 1000).toFixed(1)}" y1="${(PITH[1] * 1000).toFixed(1)}" x2="${x0.toFixed(1)}" y2="0"/>
        ${t}
        <g class="cl" data-ge="40"><line class="lead" x1="170" y1="770" x2="150" y2="866"/><circle class="dot" cx="170" cy="770" r="5"/></g>
        <g class="cl" data-ge="21" data-le="31"><line class="lead" x1="${x0.toFixed(1)}" y1="${ringY(24)}" x2="800" y2="150"/><circle class="dot" cx="${x0.toFixed(1)}" cy="${ringY(24)}" r="5"/></g>
        <g class="cl" data-ge="16" data-le="27"><line class="lead" x1="335" y1="430" x2="250" y2="340"/><circle class="dot" cx="335" cy="430" r="5"/></g>
        <g class="cl" data-le="6"><line class="lead" x1="${(PITH[0] * 1000).toFixed(1)}" y1="${(PITH[1] * 1000).toFixed(1)}" x2="800" y2="500"/><circle class="dot" cx="${(PITH[0] * 1000).toFixed(1)}" cy="${(PITH[1] * 1000).toFixed(1)}" r="5"/></g>
        <g id="tag" class="is-hidden"><rect class="tag-bg" x="38" y="-11" width="88" height="22"/><circle class="tag-dot" r="5"/><line class="lead" x1="5" y1="0" x2="36" y2="0"/><text id="tag-t" class="tag-t" x="42" y="5">RING ${NORTH}</text></g>
      </svg>`;
}

// ---------- the loupe figure: ring boundaries from the same data ----------
function loupeSvg() {
  const top = Math.round((D.pithUV[1] * 1500 - 560) * (5381 / 1500));
  const ys = D.ticks.map(k => ({ ring: k.ring, y: k.v * 5381 - top })).filter(k => k.y > 4 && k.y < 476);
  const a = ys.find(k => k.ring === 31), b = ys.find(k => k.ring === 30);
  return `<svg viewBox="0 0 720 480" aria-hidden="true" focusable="false">
          <path class="bk" d="M24 ${a.y.toFixed(0)} h-10 V${b.y.toFixed(0)} h10"/>
          <rect class="fb" x="30" y="${(((a.y + b.y) / 2) - 16).toFixed(0)}" width="92" height="32"/><text class="fc" x="42" y="${(((a.y + b.y) / 2) + 5).toFixed(0)}">ONE RING</text>
          <line class="lead" x1="470" y1="${(a.y + 24).toFixed(0)}" x2="520" y2="70"/><rect class="fb" x="512" y="40" width="190" height="60"/><text class="fc" x="524" y="64">EARLYWOOD</text><text class="ft" x="524" y="86">pale, crumbly</text>
          <line class="lead" x1="500" y1="${(b.y - 22).toFixed(0)}" x2="540" y2="400"/><rect class="fb" x="512" y="372" width="190" height="60"/><text class="fc" x="524" y="396">LATEWOOD</text><text class="ft" x="524" y="418">dark, dense</text>
        </svg>`;
}

// ---------- invented skeleton plot for the crossdating page ----------
function skeleton() {
  let seed = 11; const R = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const thr = .62, master = Array.from({ length: 40 }, () => .25 + R() * 1.3), off = 9;
  const A = master.slice(off, off + 24).map(w => Math.max(.2, w + (R() - .5) * .12));
  let seedB = 17; const RB = () => (seedB = (seedB * 1664525 + 1013904223) >>> 0) / 4294967296;   // its own stream: B is unrelated to the master
  const B = Array.from({ length: 24 }, () => .25 + RB() * 1.3);
  const X0 = 150, DX = 19.5, rows = [{ y: 110, w: master, at: 0, name: 'MASTER', sub: 'dated' }, { y: 235, w: A, at: off, name: 'SAMPLE A', sub: 'undated' }, { y: 360, w: B, at: off, name: 'SAMPLE B', sub: 'undated' }];
  let g = '', gA = '', hitA = 0, nA = 0, hitB = 0, nB = 0;
  const len = (w) => 10 + (thr - w) / thr * 62;
  rows.forEach((r, ri) => {
    g += `<line class="ax" x1="${X0}" y1="${r.y}" x2="${X0 + 40 * DX}" y2="${r.y}"/>`;
    for (let i = 0; i < 40; i++) g += `<line class="ax" x1="${X0 + i * DX + DX / 2}" y1="${r.y}" x2="${X0 + i * DX + DX / 2}" y2="${r.y + (i % 5 === 0 ? 7 : 3)}"/>`;
    g += `<text class="tc" x="8" y="${r.y - 18}">${r.name}</text><text class="tm" x="8" y="${r.y - 2}">${r.sub}</text>`;
    r.w.forEach((w, j) => {
      if (w >= thr) return; const idx = r.at + j, x = X0 + idx * DX + DX / 2;
      let hit = false; if (ri > 0) { hit = master[idx] < thr; if (ri === 1) { nA++; if (hit) hitA++; } else { nB++; if (hit) hitB++; } }
      const line = `<line class="nr${hit ? ' hit' : ''}" x1="${x}" y1="${r.y}" x2="${x}" y2="${r.y - len(w)}"`;
      if (ri === 0) g += `${line} data-i="${idx}"/>`; else if (ri === 1) gA += `${line} data-j="${j}"/>`; else g += `${line}/>`;
    });
  });
  g += `<g id="sa" data-dx="${DX}" data-off="${off}">${gA}</g>`;
  for (const y of [1801, 1810, 1820, 1830, 1840]) g += `<text class="tm" x="${X0 + (y - 1801) * DX + DX / 2}" y="${142}" text-anchor="middle">${y}</text>`;
  return { svg: `<svg class="skel" viewBox="0 0 960 400" role="img" aria-label="Skeleton plot, invented data. The master record shows narrow rings as vertical lines on a dated axis. Sample A, started in 1810, has narrow rings in the same years. Sample B, at the same shift, does not.">${g}</svg>`, hitA, nA, hitB, nB, off, nAring: nA };
}

// the slider is a control for people with JavaScript; without it the plot shows sample A already lined up
const slideFig = (S) => `<figure class="fig slide" data-slide><div class="fig__box">${S.svg}</div>
        <div class="slide__ctl"><label class="mono" for="shift">Slide sample A along the master</label><input id="shift" type="range" min="0" max="16" step="1" value="${S.off}"><output class="mono" id="shift-out" for="shift" aria-live="polite">Starts in ${1801 + S.off}: ${S.hitA} of its ${S.nA} narrow rings line up.</output></div>
        <figcaption>Illustration with invented widths, not measured wood. Slide sample A until its narrow rings fall under the master’s: started in 1810, ${S.hitA} of its ${S.nA} line up. Sample B, at the same shift, manages ${S.hitB} of ${S.nB}.</figcaption></figure>`;

// ---------- the three kinds of result, as a timeline (invented dates) ----------
function resultSvg() {
  const X0 = 170, DX = 9.5, Y0 = 1600, x = (y) => X0 + (y - Y0) * DX;
  const rows = [
    { y: 118, name: 'BARK EDGE', sub: 'last ring 1647' },
    { y: 218, name: 'SOME SAPWOOD', sub: 'last ring 1624' },
    { y: 318, name: 'HEARTWOOD ONLY', sub: 'last ring 1610' },
  ];
  let g = '';
  for (let yr = 1600; yr <= 1680; yr += 10) g += `<line class="ax" x1="${x(yr)}" y1="40" x2="${x(yr)}" y2="352"/><text class="tm" x="${x(yr)}" y="28" text-anchor="middle">${yr}</text>`;
  rows.forEach((r) => { g += `<text class="tc" x="8" y="${r.y - 4}">${r.name}</text><text class="tm" x="8" y="${r.y + 16}">${r.sub}</text>`; });
  // 1 bark edge: rings to 1647, felling year is that year
  g += `<line class="tl" x1="${x(1604)}" y1="118" x2="${x(1647)}" y2="118"/><line class="rl" x1="${x(1647)}" y1="92" x2="${x(1647)}" y2="144"/><text class="tc" x="${x(1647) + 12}" y="104">FELLED 1647</text>`;
  // 2 some sapwood: last measured ring 1624, plus 9 to 41 sapwood rings
  g += `<line class="tl" x1="${x(1600)}" y1="218" x2="${x(1624)}" y2="218"/><line class="ra dash" x1="${x(1624)}" y1="218" x2="${x(1633)}" y2="218"/><rect class="rb" x="${x(1633)}" y="209" width="${x(1665) - x(1633)}" height="18"/><text class="tc" x="${x(1633)}" y="196">FELLED 1633 TO 1665</text><text class="tm" x="${x(1633)}" y="250">last ring + 9 to 41 sapwood rings</text>`;
  // 3 heartwood only: last ring 1610, felled after 1619
  g += `<line class="tl" x1="${x(1600)}" y1="318" x2="${x(1610)}" y2="318"/><line class="ra dash" x1="${x(1610)}" y1="318" x2="${x(1619)}" y2="318"/><line class="ra" x1="${x(1619)}" y1="318" x2="${X0 + 80 * DX - 6}" y2="318"/><path class="ra" d="M${X0 + 80 * DX - 16} 308 L${X0 + 80 * DX - 4} 318 L${X0 + 80 * DX - 16} 328"/><line class="rl" x1="${x(1619)}" y1="296" x2="${x(1619)}" y2="340"/><text class="tc" x="${x(1619) + 12}" y="296">FELLED AFTER 1619</text><text class="tm" x="${x(1619) + 12}" y="352">last ring + at least 9 sapwood rings</text>`;
  return `<svg class="skel" viewBox="0 0 960 370" role="img" aria-label="Three timelines with invented dates. With the bark edge, the last ring, 1647, is the felling year. With some sapwood, the last measured ring is 1624 and the felling falls between 1633 and 1665. With heartwood only, the last ring is 1610 and the result is only that the tree was felled after 1619.">${g}</svg>`;
}

// ---------- page chrome ----------
const NAV = [['/crossdating', 'Method'], ['/the-year-without-a-summer', '1816'], ['/timber-dating', 'Timber']];
const BACKDROP = '<div class="bg" aria-hidden="true"><div class="bg__still"></div><noscript><img class="bg__ns" src="/img/wood-still.webp" alt="" aria-hidden="true" width="1024" height="576" decoding="async"></noscript><video class="bg__v" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1" data-webm="/video/loop.webm" data-mp4="/video/loop.mp4"></video></div>';
const header = (cur) => `${BACKDROP}
<a class="skip" href="#main">Skip to content</a>
<header class="site">
  <a class="brand" href="/" aria-label="Pithwell, home">Pith<b>well</b></a>
  <nav class="nav mono" aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<a class="ask" href="${MAILTO}">Ask</a></nav>
</header>`;
const footer = `<footer class="foot">
  <div class="foot__in">
    <div><a class="brand" href="/" aria-label="Pithwell, home">Pith<b>well</b></a>
    <p class="concept mono">Pithwell is a concept site. The brand is fictional.</p></div>
    <div><p>The dendrochronology and the sources on these pages are real. The studio, its address for mail and everything it offers are not. There are no forms, no accounts and no prices.</p>
    <nav class="mono" aria-label="Footer"><a href="/">Home</a><a href="/crossdating">Method</a><a href="/the-year-without-a-summer">1816</a><a href="/timber-dating">Timber</a><a href="${MAILTO}">Ask about a sample</a></nav></div>
  </div>
</footer>`;

const CSP_META = `default-src 'self'; script-src 'self' '${BOOT_HASH}'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;

function jsonld(p) {
  const url = ORIGIN + p.path, org = { '@id': ORIGIN + '/#org' };
  const g = [
    { '@type': 'WebSite', '@id': ORIGIN + '/#website', url: ORIGIN + '/', name: 'Pithwell', inLanguage: 'en-GB', publisher: org },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Pithwell', url: ORIGIN + '/', logo: ORIGIN + '/img/logo-512.png' },
    { '@type': p.kind || 'WebPage', '@id': url + '#webpage', url, name: p.title, description: p.desc, inLanguage: 'en-GB', isPartOf: { '@id': ORIGIN + '/#website' }, primaryImageOfPage: { '@type': 'ImageObject', url: ORIGIN + '/img/og.jpg', width: 1200, height: 630 }, datePublished: DATE, dateModified: DATE },
    { '@type': 'BreadcrumbList', itemListElement: p.crumbs.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: ORIGIN + u })) },
  ];
  if (p.article) g.push({ '@type': 'Article', '@id': url + '#article', headline: p.article, description: p.desc, author: org, publisher: org, datePublished: DATE, dateModified: DATE, mainEntityOfPage: { '@id': url + '#webpage' }, image: ORIGIN + '/img/og.jpg', inLanguage: 'en-GB' });
  if (p.faq && p.faq.length) g.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }, null, 2);
}

function head(p) {
  const url = ORIGIN + p.path;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP_META}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
${p.verify ? `<meta name="google-site-verification" content="${p.verify}">\n` : ''}<meta property="og:type" content="${p.article ? 'article' : 'website'}">
<meta property="og:site_name" content="Pithwell">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.ogDesc || p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A cross-section of a tree trunk in orange wood, its growth rings counted back from the outer edge, beside the word Pithwell.">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${esc(p.ogDesc || p.desc)}">
<meta name="twitter:image" content="${ORIGIN}/img/og.jpg">
<meta name="theme-color" content="#0a0c0a">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preload" href="/fonts/eb-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/eb-garamond-latin-wght-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/sometype-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${p.preload || ''}<link rel="stylesheet" href="/css/style.css">
${p.home ? `<script>${BOOT}</script>\n` : ''}<script type="application/ld+json">
${jsonld(p)}
</script>
</head>`;
}

const qsec = (id, tag, q, answer, depth) => `
  <section class="sec" id="${id}" aria-labelledby="h-${id}">
    <div class="sec__in">
      <div><span class="sec__tag mono">${tag}</span><h2 id="h-${id}">${q}</h2></div>
      <div class="prose"><p class="ans">${answer}</p>${depth}</div>
    </div>
  </section>`;

const crumbs = (items) => `<p class="crumbs mono">${items.map(([n, u]) => u ? `<a href="${u}">${n}</a>` : n).join(' / ')}</p>`;

// ---------- content ----------
const FAQ_HOME = [
  ['Does tree-ring dating damage the timber?', ans('Usually very little. Where a cut end is exposed, the surface can be sanded and read in place. Otherwise a small core is taken: hand borers for living trees take cores about 5 millimetres across, and the tree normally seals the hole. For a carved or painted object we would first ask whether an exposed edge already exists.', 'faq1')],
  ['Why do you count from the bark inward?', ans('The bark edge is the one ring with a known year: the last the tree grew. Each ring inside it is one year earlier, so counting back from it keeps every date anchored. Reference chronologies are built the same way, from living trees back through older and older timber that overlaps them.', 'faq2')],
  ['How far back can tree-ring dating reach?', ans('Some regional chronologies run back more than 12,000 years, built by overlapping living trees, dead trees and timber from buildings. Whether your sample can use one depends on its species and where it grew. No single chronology covers every wood or every place, so some timbers cannot be dated at all.', 'faq3')],
  ['Can you tell a tree’s age from a stump?', ans('Counting rings on a stump gives the tree’s age at that height. It falls a few years short of the true age, because the sapling needed time to grow that tall. A core taken nearer the ground gets closer. Neither gives a calendar date unless the rings are also matched against dated wood.', 'faq4')],
];

const ANS_METHOD = ans('A tree adds one ring a year, and its width follows the weather. Many trees in one region share the same run of wide and narrow rings, so an undated timber can be matched against dated ones. The match fixes each ring to a calendar year; with the bark edge intact, the last ring is the felling year.', 'method');
const ANS_SAMPLE = ans('It needs a long enough run of rings to match, and ideally the bark edge. With the bark edge, the last ring gives the felling year. With some sapwood left, we can give a range. With none, the result is only a date after which the tree was felled. We say which of the three you have.', 'sample');
const ANS_MATERIAL = ans('Any wood with clear annual rings, from a species and region that has a reference chronology. That covers roof and floor timbers, oak panels and chests, ship timbers and the spruce tops of violins. Tropical woods without clear annual rings, and species with no regional reference, are much harder.', 'material');

const HOME_FAQS = [['How can a ring give you a calendar year?', ANS_METHOD], ['What does a timber have to show before it can be dated?', ANS_SAMPLE], ['What kinds of wood can be dated?', ANS_MATERIAL], ...FAQ_HOME];

function home() {
  const p = {
    path: '/', home: true, kind: 'WebPage', verify: GSC_TAG,
    title: 'Pithwell | Tree-ring dating for old timber',
    desc: 'Pithwell dates old timber by its tree rings. Watch one section read from bark to pith, and see what a sample must show to give a felling year.',
    ogTitle: 'Count back from the bark', ogDesc: 'Tree-ring dating for old timber, shown by reading one cross-section from its newest ring to its pith.',
    crumbs: [['Home', '/']], faq: HOME_FAQS,
    preload: `<link rel="preload" as="image" media="(max-width: 899px)" href="/img/disc-640.webp" imagesrcset="/img/disc-640.webp 640w, /img/disc-900.webp 900w" imagesizes="min(84vw, 360px)" fetchpriority="high">\n<link rel="preload" as="image" media="(min-width: 900px)" href="/img/disc-900.webp" imagesrcset="/img/disc-900.webp 900w, /img/disc-1400.webp 1400w" imagesizes="58vw" fetchpriority="high">\n<link rel="preload" as="image" href="/img/hero-bg.webp">\n`,
  };
  const body = `<body>
${header('')}
<main id="main">
  <section class="hero" aria-labelledby="h1" data-start="${MAXR + 0.3}" data-end="0.4" data-tmax="${D.tmax}" data-north="${NORTH}" data-pith-u="${PITH[0]}" data-pith-v="${PITH[1]}">
    <div class="hero__stage">
      <div class="hero__copy">
        <h1 id="h1">Count back <em>from the bark.</em></h1>
        <p class="lede">Pithwell dates old timber by its tree rings. <span class="hide-m">The outermost ring is the year the tree was felled; every ring inside it is one year earlier. Scroll, and this section is read the way we would read it: newest ring first, down to the pith.</span></p>
        <div class="ledger"><span class="ledger__n" id="ring-n" aria-hidden="true">${MAXR}</span><p class="ledger__cap mono" id="ring-cap">Ring number, counted from the pith.<span class="hide-m"> The frame holds up to ${MAXR} rings; ${NORTH} lie along the marked line.</span></p></div>
        <div class="scrub"><label class="mono" for="scrub">Read back to ring</label><input id="scrub" type="range" min="1" max="${MAXR}" step="1" value="${MAXR}" aria-describedby="ring-cap"></div>
        <p class="cue mono">Scroll to read inward</p>
        <div class="btns"><a class="btn mono" href="${MAILTO}">Ask about a sample</a><a class="more mono" href="/crossdating">How crossdating works</a></div>
      </div>
      <div class="wrap">
        <div class="disc"><picture><source media="(max-width: 899px)" srcset="/img/disc-640.webp 640w, /img/disc-900.webp 900w" sizes="min(84vw, 360px)"><img src="/img/disc-900.webp" srcset="/img/disc-900.webp 900w, /img/disc-1400.webp 1400w" sizes="58vw" width="1400" height="1400" fetchpriority="high" decoding="async" alt="A tree trunk cut straight across and photographed head-on: about forty fine concentric growth rings in orange wood around a small dark pith, with stained, darker wood in the corners."></picture><canvas aria-hidden="true"></canvas></div>
        ${coreSvg()}
        <div class="co co--0" data-ge="40"><b>Newest wood</b>The outermost rings in this frame.</div>
        <div class="co co--2" data-ge="21" data-le="31"><b>One ring</b>Pale earlywood, then a dark band of latewood.</div>
        <div class="co co--3" data-ge="16" data-le="27"><b>A fine crack</b>It runs along one ring.</div>
        <div class="co co--1" data-le="6"><b>Pith</b>The first year’s wood. Everything else grew around it.</div>
      </div>
    </div>
  </section>
${qsec('method', 'Method', 'How can a ring give you a <em>calendar year?</em>', ANS_METHOD, `
        <p>In a softwood like the one pictured, each ring is a pair of bands. Earlywood grows in spring and is pale, with wide, thin-walled cells. Latewood grows later in the season and is darker, denser and narrower. The sharp edge between one year’s latewood and the next year’s earlywood is the line that gets counted.</p>
        <p>Width is the signal. A warm, wet summer lets a tree lay down a wide ring; a drought or a late frost leaves a narrow one. Trees in one region get the same weather, so their narrow and wide rings fall in the same years. Matching those patterns between samples is called <a href="/crossdating">crossdating</a>, and it is the whole method. Chronologies built this way now run past 12,000 years.</p>
        ${slideFig(skeleton())}
        <p>The photograph on this page holds no date, so we can count its rings but not name their years. We counted ${NORTH} along the line from the pith to the top edge of the frame, with software that follows each ring outward, and checked the count against a second method. On the four cleanest rays the two agreed to within one ring.</p>
        <figure class="fig"><div class="fig__box"><img src="/img/loupe.webp" width="720" height="480" loading="lazy" decoding="async" alt="A close crop of the wood: horizontal bands of pale, crumbly earlywood alternating with narrower, darker, denser bands of latewood. Six complete rings are visible.">${loupeSvg()}</div><figcaption>Six rings at full detail: a 720 × 480 pixel crop of the original 5,381-pixel photograph. Pale, crumbly bands are earlywood; the dark, dense bands are latewood.</figcaption></figure>`)}
  <section class="sec" id="sample" aria-labelledby="h-sample">
    <div class="wide">
      <span class="sec__tag mono">What a sample needs</span>
      <h2 id="h-sample">What does a timber have to show <em>before it can be dated?</em></h2>
      <p class="ans">${ANS_SAMPLE}</p>
      <figure class="fig">${resultSvg()}<figcaption>The three kinds of result, drawn with invented dates. The nine-to-41 range is a published sapwood estimate for medieval and modern English oak at 95% confidence; real estimates depend on region and period.</figcaption></figure>
      <table><caption>In words</caption>
        <tr><th scope="row">The bark edge</th><td>The felling year, from the last ring. If that ring is incomplete, often the season of felling too.</td></tr>
        <tr><th scope="row">Part of the sapwood</th><td>A range for the felling date. Published sapwood estimates for English oak run from about 9 to 46 rings, depending on region and period.</td></tr>
        <tr><th scope="row">Heartwood only</th><td>A “felled after” date: the last ring plus the minimum sapwood allowance. The real felling can be decades later.</td></tr>
      </table>
      <p class="src">A long run of rings matches with more confidence than a short one. Reports from English Heritage’s Ancient Monuments Laboratory, held by the Archaeology Data Service, caution against relying on a single timber with fewer than 100 rings. The <a href="/timber-dating">timber page</a> goes through what a result states.</p>
    </div>
  </section>
  <section class="sec" id="material" aria-labelledby="h-material">
    <div class="wide">
      <span class="sec__tag mono">Material</span>
      <h2 id="h-material">What kinds of wood can be dated?</h2>
      <p class="ans">${ANS_MATERIAL}</p>
      <ul class="kinds">
        <li><span class="mono">Roof and floor timbers</span>Often several from one building, which gives a firmer date.</li>
        <li><span class="mono">Oak panels and chests</span>The surface is often the only edge there is to read.</li>
        <li><span class="mono">Ship timbers</span>Large pieces can carry long runs of rings.</li>
        <li><span class="mono">Violin tops</span>Spruce with narrow, even rings that suit measuring.</li>
      </ul>
      <p class="src">Reference records are public. NOAA’s International Tree-Ring Data Bank holds ring-width, density and isotope records from more than 5,000 sites on six continents. A chronology only helps for the species and the region it covers, so the first question about any sample is where the tree grew. We would rather give a plain “cannot be dated” than a date that does not hold.</p>
    </div>
  </section>
  <section class="sec" id="faq" aria-labelledby="h-faq">
    <div class="faq">
      <h2 id="h-faq">Four more questions</h2>
      <dl>${FAQ_HOME.map(([q, a]) => `
        <div class="faq__i"><dt>${esc(q)}</dt><dd>${a}</dd></div>`).join('')}
      </dl>
    </div>
  </section>
  <section class="cta" id="enquire" aria-labelledby="h-enq">
    <img class="cta__bg" src="/img/banner-3.webp" width="1200" height="466" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <div class="cta__in">
      <h2 id="h-enq">Ask about <em>a sample</em></h2>
      <p class="ans">Tell us what the timber is, where it came from and whether any bark edge or pale sapwood survives. A photograph of the cut end, with a ruler beside it, is the best first step.</p>
      <div class="btns"><a class="btn btn--lg mono" href="${MAILTO}">Ask about a sample</a></div>
    </div>
  </section>
  <section class="sec" id="sources" aria-labelledby="h-src">
    <div class="sec__in">
      <div><span class="sec__tag mono">Sources</span><h2 id="h-src">Where the facts come from</h2></div>
      <div class="prose">${srcList(['ltrr', 'itrdb', 'ads', 'slides', 'photo'])}</div>
    </div>
  </section>
</main>
${footer}
<script type="module" src="/js/main.js"></script>
<script type="module" src="/js/bg.js"></script>
</body>
</html>
`;
  return { p, html: head(p) + '\n' + body };
}

function article(p, bodyInner, cur) {
  return head(p) + `\n<body>\n${header(cur)}\n<main id="main">\n  <header class="page-head ph-${p.core.n}"><div class="page-head__in">\n    ${crumbs(p.crumbTxt)}\n    <h1>${p.h1}</h1>\n    <p class="lede">${p.lede}</p>\n    <p class="meta mono">${p.meta}</p>\n  </div></header>${bodyInner.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (m, a, b) => `<h2${a}>${b.replace(/<\/?em>/g, '')}</h2>`)}\n</main>\n${footer}\n${bodyInner.includes('data-slide') ? '<script type="module" src="/js/main.js"></script>\n' : ''}<script type="module" src="/js/bg.js"></script>\n</body>\n</html>\n`;
}

function crossdating() {
  const S = skeleton();
  const a1 = ans('Crossdating is matching the pattern of wide and narrow rings in a piece of wood against dated samples from the same region, until every ring has exactly one calendar year. It is what turns ring counting into dating, and it catches rings that a plain count would miss or invent.', 'cd1');
  const a2 = ans('A count gives the number of rings, not their years. A tree can skip a ring in a bad year or lay down a false one after a dry spell, so even a clean sample can be wrong by one or two. Matching against dated wood exposes both mistakes. That is why dating is pattern-matching, not counting.', 'cd2');
  const a3 = ans('A master chronology is an average ring-width record for one species and region, built by crossdating living trees and then older timber that overlaps them. The longest regional ones reach back more than 12,000 years. A new sample is dated by sliding it along the master until the patterns agree.', 'cd3');
  const a4 = ans('Software compares ring widths and reports a t-value. English Heritage reports often treat a t-value of about 3.5 or more as a match, if the curves also look alike, and prefer 5 or 6 and higher because lower values can be spurious. A date is stronger when it matches more than one reference chronology.', 'cd4');
  const faq = [['What is crossdating?', a1], ['Why can’t you just count the rings?', a2], ['What is a master chronology?', a3], ['How good does a match have to be?', a4]];
  const p = {
    path: '/crossdating', kind: 'WebPage', article: 'How crossdating fixes a tree ring to a calendar year',
    title: 'How crossdating works | Pithwell',
    desc: 'Crossdating matches tree-ring patterns against dated wood until each ring has one calendar year. How it works, why counting fails, and how a match is judged.',
    crumbs: [['Home', '/'], ['Method', '/crossdating']], crumbTxt: [['Pithwell', '/'], ['Method', '']],
    h1: 'How crossdating <em>fixes a ring to a year</em>',
    lede: 'Counting rings tells you how old a piece of wood is. Crossdating tells you when it grew. The difference is the whole reason tree-ring dating works.',
    meta: `Pithwell · ${DATE}`, faq, core: { n: 1, r: '1 to 20', w: 992 },
  };
  const inner = `
${qsec('what', 'Definition', 'What is <em>crossdating?</em>', a1, `
        <p>The Laboratory of Tree-Ring Research at the University of Arizona calls it the field’s most fundamental technique. Its own wording is that dendrochronologists demand a single calendar year for each ring. A. E. Douglass began the work there in 1904, with specimens collected in the lumber yards of Flagstaff, and the laboratory itself was approved as a university department in December 1937.</p>`)}
${qsec('count', 'Why not count', 'Why can’t you just <em>count the rings?</em>', a2, `
        <p>Trees do not always form a complete ring. In a severe drought, or in a year of insect attack, part of the cambium, the layer that makes new wood, can stay dormant all season. The ring is then present in some places on the trunk and absent in others. St. George and Anchukaitis call this one of the main reasons tree-ring dating is done by pattern-matching and not ring counting.</p>
        <p>The oldest drawing method for doing that matching is the skeleton plot. Only the narrow rings are marked, as lines on a dated axis, and the lines from an undated sample are slid along until they sit under the lines of a dated one.</p>
        ${slideFig(S)}`)}
${qsec('master', 'Chronologies', 'What is a <em>master chronology?</em>', a3, `
        <p>The reference records are shared. NOAA’s International Tree-Ring Data Bank, the world’s largest public archive of tree-ring data, lists more than 5,000 sites on six continents, with ring-width, wood-density and isotope series. Anyone can search it by species, place or investigator.</p>`)}
${qsec('match', 'Judging a match', 'How good does a match <em>have to be?</em>', a4, `
        <p>The visual check matters as much as the number. Two curves can reach a respectable t-value by chance, in a short sample especially, so the curves are plotted and read by eye, and the date has to make sense for the timber. When it does not, the honest result is “no secure date”.</p>
        <p class="src">Further reading: Stokes and Smiley, <em>An Introduction to Tree-Ring Dating</em> (University of Chicago Press, 1968).</p>`)}
  <section class="sec" id="sources" aria-labelledby="h-src"><div class="sec__in"><div><span class="sec__tag mono">Sources</span><h2 id="h-src">Where the facts come from</h2></div><div class="prose">${srcList(['ltrr', 'ltrrh', 'itrdb', 'pages', 'ads'])}</div></div></section>`;
  return { p, html: article(p, inner, '/crossdating') };
}

function year1816() {
  const a1 = ans('After Tambora erupted on 10 April 1815, dust and ash spread round the world and summers stayed cold for several years. In many places trees answered with narrow rings. The record is uneven: some trees barely reacted, and some narrow rings in later years have other causes, such as insect outbreaks.', 'y1');
  const a2 = ans('No, and that is why dendrochronologists read many trees, not one. A 700-year-old larch in the Alps, shown by the Swiss research institute WSL, reduced its growth only partly and after a delay. Its narrow ring in 1821 may come from a larch budmoth outbreak that year instead of from the cold.', 'y2');
  const a3 = ans('No. In 2012 Mann and colleagues argued that trees at their cold limit might have skipped 1816. Tests on European and American records rejected it, and a radiocarbon spike dated to AD 774–775 turns up in tree rings from several continents at the same year. The Year Without a Summer was not a year without a ring.', 'y3');
  const faq = [['What did the 1816 summer do to trees?', a1], ['Did 1816 leave a narrow ring in every tree?', a2], ['Is the ring for 1816 missing in some trees?', a3]];
  const p = {
    path: '/the-year-without-a-summer', kind: 'WebPage', article: '1816, the year without a summer, as trees recorded it',
    title: '1816, the year without a summer, in tree rings | Pithwell',
    desc: 'Tambora erupted in April 1815 and 1816 became the year without a summer. What trees recorded, where they did not, and why the ring for 1816 is not missing.',
    crumbs: [['Home', '/'], ['1816', '/the-year-without-a-summer']], crumbTxt: [['Pithwell', '/'], ['1816', '']],
    h1: 'The year <em>without a summer,</em> in wood',
    lede: 'A volcano in Indonesia cooled the whole northern summer of 1816. Trees kept the record, unevenly, and the unevenness is part of what they tell us.',
    meta: `Pithwell · ${DATE}`, faq, core: { n: 3, r: '19 to 38', w: 1269 },
  };
  const inner = `
${qsec('rings', 'The record', 'What did the 1816 summer <em>do to trees?</em>', a1, `
        <p>Mount Tambora erupted on 10 April 1815. Roughly 60 million tonnes of sulfur reached the stratosphere, making it the third-largest volcanic event of the last 1,500 years by atmospheric loading. Snow fell in Quebec, Maine and New York in June 1816, frosts reached as far south as New Jersey, and crops failed across North America and parts of Europe.</p>
        <p>Instrument records are thin, which is why trees matter. The few thermometers then running suggest Northern Hemisphere temperatures dipped by 0.7 to 0.8 °C in 1816. In the Alps, summers from 1813 to 1816 were exceptionally cold, and growth was held back for several years.</p>`)}
${qsec('uneven', 'One tree, one witness', 'Did 1816 leave a narrow ring <em>in every tree?</em>', a2, `
        <p>Look at one tree and the story is ambiguous. Look at hundreds and it is not. That is the job of a chronology: it averages away the larch budmoth, the shaded decade and the lightning scar, and leaves the signal that trees in one region share.</p>`)}
${qsec('missing', 'The dispute', 'Is the ring for 1816 <em>missing in some trees?</em>', a3, `
        <p>Mann and colleagues (2012) argued that trees near their cold limit may not have formed a ring in 1816, which would put some older tree-ring dates a year out. Esper and colleagues (2013) tested this by deleting 1816 from several density records, re-dating every earlier ring by one year, and checking against thermometer records and a five-century documentary reconstruction. The altered series stopped matching either.</p>
        <p>St. George and colleagues (2013) then surveyed 2,359 ring-width records across the Northern Hemisphere. Locally absent rings were frequent in the American Southwest during severe droughts and extremely rare at high-latitude and high-elevation sites, exactly where the “missing 1816” idea needed them to be common.</p>
        <p>None of this makes dating infallible. It is a reason to cross-check every sample against several others and to say so when it cannot be done.</p>`)}
  <section class="sec" id="sources" aria-labelledby="h-src"><div class="sec__in"><div><span class="sec__tag mono">Sources</span><h2 id="h-src">Where the facts come from</h2></div><div class="prose">${srcList(['wsl', 'pages', 'esper', 'ltrr'])}</div></div></section>`;
  return { p, html: article(p, inner, '/the-year-without-a-summer') };
}

function timber() {
  const a1 = ans('Where the tree grew, what the timber was used for, and a clear photograph of any cut end with a ruler beside it. Say whether any bark edge or pale sapwood survives. We would rather hear the awkward details first: they decide which of the three kinds of result is possible, and whether to go further.', 't1');
  const a2 = ans('More is better. A long run of rings has fewer chance matches than a short one, so short samples are treated with caution. Reports from English Heritage’s Ancient Monuments Laboratory warn against relying on one timber with fewer than 100 rings. Several timbers from the same building, felled together, make a firmer date.', 't2');
  const a3 = ans('Sapwood is the outer, living part of the trunk, and it is the first thing lost when a timber is trimmed. Oak sapwood has a limited number of rings, so if some survives, the felling date can be estimated. Published estimates for English oak run from about 9 to 46 rings, by region and period.', 't3');
  const a4 = ans('It tells you when the tree was felled, not when the building was finished. Timber was often used soon after felling, but it could be stored or reused from an older building. A date is stronger when several timbers agree on the same felling year or season, and weaker when only one does.', 't4');
  const faq = [['What do you need from the owner of a timber?', a1], ['How many rings are enough?', a2], ['What is sapwood and why does it matter?', a3], ['Does a tree-ring date tell you when a building was built?', a4]];
  const p = {
    path: '/timber-dating', kind: 'WebPage', article: 'What tree-ring dating can and cannot say about a piece of timber',
    title: 'What tree-ring dating can say about timber | Pithwell',
    desc: 'Bark edge, sapwood or heartwood only: what each lets a tree-ring date say about a timber, and why a date for the tree is not always one for the building.',
    crumbs: [['Home', '/'], ['Timber', '/timber-dating']], crumbTxt: [['Pithwell', '/'], ['Timber', '']],
    h1: 'What we can say <em>about a timber</em>',
    lede: 'A tree-ring result is one of three kinds, and which one you get depends on what survives on the wood. Here is how to tell before you send anything.',
    meta: `Pithwell · ${DATE}`, faq, core: { n: 2, r: '10 to 29', w: 1164 },
  };
  const inner = `
${qsec('need', 'Before you send', 'What do you need <em>from the owner?</em>', a1, `
        <p>A result states how many rings were measured, which reference chronologies they were matched against, the match statistic, and which of the three kinds of date it is. If a timber cannot be dated, the result says that, and why.</p>`)}
${qsec('rings', 'Length', 'How many rings <em>are enough?</em>', a2, `
        <p class="src">Source: dendrochronology reports from English Heritage’s Ancient Monuments Laboratory, held by the Archaeology Data Service. We have quoted them as a caution, not as a fixed threshold.</p>`)}
${qsec('sapwood', 'Sapwood', 'What is sapwood, and <em>why does it matter?</em>', a3, `
        <table><caption>The three kinds of result</caption>
          <tr><th scope="row">Bark edge present</th><td>The felling year, from the last ring.</td></tr>
          <tr><th scope="row">Some sapwood present</th><td>A felling range, from a regional sapwood estimate.</td></tr>
          <tr><th scope="row">Heartwood only</th><td>A “felled after” date: the last ring plus the minimum sapwood allowance.</td></tr>
        </table>`)}
${qsec('building', 'Felling and building', 'Does a date tell you <em>when a building was built?</em>', a4, `
        <p>A cored beam gives one felling date. Ten beams from one roof that agree give a roof.</p>`)}
  <section class="sec" id="sources" aria-labelledby="h-src"><div class="sec__in"><div><span class="sec__tag mono">Sources</span><h2 id="h-src">Where the facts come from</h2></div><div class="prose">${srcList(['ads', 'ltrr', 'slides'])}</div></div></section>`;
  return { p, html: article(p, inner, '/timber-dating') };
}

function notFound() {
  const p = { path: '/404', title: 'Page not found | Pithwell', desc: 'There is no page at this address on Pithwell. The home page reads a tree-ring section from its bark to its pith.', crumbs: [['Home', '/']] };
  const html = head({ ...p, kind: 'WebPage' }).replace('content="index, follow, max-image-preview:large"', 'content="noindex"').replace(/<link rel="canonical"[^>]*>\n/, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '') + `\n<body>\n${header('')}\n<main id="main">\n  <header class="page-head"><div class="page-head__in"><h1>No ring <em>for that year.</em></h1><p class="lede">There is no page at this address. The <a href="/">home page</a> is the place to start.</p></div></header>\n</main>\n${footer}\n<script type="module" src="/js/bg.js"></script>\n</body>\n</html>\n`;
  return { p, html };
}

// ---------- write ----------
const pages = [home(), crossdating(), year1816(), timber()];
const files = { 'index.html': pages[0].html, 'crossdating.html': pages[1].html, 'the-year-without-a-summer.html': pages[2].html, 'timber-dating.html': pages[3].html, '404.html': notFound().html };
// asset URLs carry a content hash, so a browser that cached the stylesheet or scripts can never pair them with newer markup
const hashOf = (...fs) => { const h = createHash('sha256'); for (const f of fs) h.update(readFileSync(join(DOCS, f))); return h.digest('hex').slice(0, 10); };
const CSS_V = hashOf('css/style.css'), JS_V = hashOf('js/main.js', 'js/stage.js', 'js/slide.js', 'js/bg.js');
const versioned = (h) => h.replace('href="/css/style.css"', `href="/css/style.css?v=${CSS_V}"`).replace(/src="\/js\/(main|bg)\.js"/g, (m, n) => `src="/js/${n}.js?v=${JS_V}"`);
// every content section gets its own backdrop, numbered across the pages in order so no two sections share one;
// bg.js fetches each one after the page has loaded, as it nears the viewport, so none can hold up the first paint
let secN = 0;
const withBackdrops = (h) => h.replace(/(<section class="sec"[^>]*>)/g, (m) => `${m}\n<div class="sec__bg" data-src="/img/sec-${++secN}.webp" aria-hidden="true"></div>`);
for (const [f, h] of Object.entries(files)) writeFileSync(join(DOCS, f), versioned(withBackdrops(h)));
if (secN !== 19) throw new Error('expected 19 section backdrops, placed ' + secN);

writeFileSync(join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ p }) => `  <url>\n    <loc>${ORIGIN}${p.path}</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${p.path === '/' ? '0.8' : '0.6'}</priority>\n  </url>`).join('\n')}
</urlset>
`);

writeFileSync(join(DOCS, 'robots.txt'), `# Every search and answer crawler is welcome. Nothing here is private.\nUser-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

writeFileSync(join(DOCS, 'llms.txt'), `# Pithwell

> A concept website for a fictional tree-ring dating studio. The brand is fictional; the dendrochronology and the sources on these pages are real. One photographed tree section is read from its newest ring to its pith, and the pages explain what a ring can and cannot date.

## Pages

- [Home](${ORIGIN}/): one cross-section read from the bark inward, ${MAXR} whole rings in the frame and ${NORTH} along the core line, with seven questions answered.
- [How crossdating works](${ORIGIN}/crossdating): matching wide and narrow rings against dated wood, why counting alone fails, and how a match is judged.
- [1816 in tree rings](${ORIGIN}/the-year-without-a-summer): the Tambora eruption of 10 April 1815, what trees recorded in 1816, and the missing-ring dispute.
- [What we can say about a timber](${ORIGIN}/timber-dating): bark edge, sapwood and heartwood-only results, and how many rings are enough.

## Facts stated on the site

- Dendrochronology assigns one calendar year to each ring by crossdating. Regional chronologies reach back more than 12,000 years (Laboratory of Tree-Ring Research, University of Arizona).
- The International Tree-Ring Data Bank, run by NOAA, holds records from more than 5,000 sites on six continents.
- Mount Tambora erupted on 10 April 1815. Northern Hemisphere temperatures dipped by about 0.7 to 0.8 °C in 1816 (St. George and Anchukaitis, PAGES Magazine, 2015).
- Published sapwood estimates for English oak run from about 9 to 46 rings, depending on region and period.
- The photographed section holds ${MAXR} whole rings in the frame and ${NORTH} along the line from the pith to the top edge. The photograph carries no calendar date.
- Skeleton-plot figures on the crossdating page use invented widths and are labelled as such.

## Contact

The enquiry link is a plain mailto to a reserved example address. There are no forms, accounts, prices or payments.
`);

const SECURITY = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self' '${BOOT_HASH}'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ! Access-Control-Allow-Origin
`;
const NOCACHE = ['/', '/crossdating', '/the-year-without-a-summer', '/timber-dating', '/404', '/llms.txt', '/robots.txt', '/sitemap.xml'];
writeFileSync(join(DOCS, '_headers'), SECURITY + ['/img/*', '/video/*', '/fonts/*', '/css/*'].map(p => `\n${p}\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`).join('') + '\n/js/*\n  Cache-Control: public, no-cache\n' + NOCACHE.map(p => `\n${p}\n  Cache-Control: no-cache, no-store, must-revalidate\n`).join(''));

console.log('pages written; boot hash', BOOT_HASH);
for (const { p } of pages) console.log(p.path, 'title', p.title.length, 'desc', p.desc.length);
