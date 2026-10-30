import { createStage } from './stage.js';
import { initSlide } from './slide.js';

if (window.top !== window.self) {
  document.documentElement.style.display = 'none';
  try { window.top.location = window.self.location; } catch (e) { /* cross-origin parent: stay hidden */ }
}

const root = document.documentElement;
root.classList.add('js');
const hero = document.querySelector('.hero');
if (hero) initHero(hero);
document.querySelectorAll('[data-slide]').forEach(initSlide);

function initHero(hero) {
  const host = hero.querySelector('.disc');
  const wrap = hero.querySelector('.wrap');
  const n = hero.querySelector('#ring-n');
  const scrub = hero.querySelector('#scrub');
  const cue = hero.querySelector('.cue');
  const ticks = [...hero.querySelectorAll('.tk')];
  const tag = hero.querySelector('#tag');
  const tagText = hero.querySelector('#tag-t');
  const marks = [...hero.querySelectorAll('[data-le], [data-ge]')];
  const start = +hero.dataset.start, end = +hero.dataset.end, tmax = +hero.dataset.tmax, northRings = +hero.dataset.north;
  const pith = [+hero.dataset.pithU * 1000, +hero.dataset.pithV * 1000];
  const ringY = ticks.map(t => +t.getAttribute('y1'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let pinned = false, lastN = -1, lastK = -1;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const frontFor = (p) => { const q = clamp((p - .04) / .9, 0, 1); return start + (end - start) * q; };
  const progress = () => { const r = hero.getBoundingClientRect(); const total = hero.offsetHeight - hero.querySelector('.hero__stage').offsetHeight; return total > 0 ? clamp(-r.top / total, 0, 1) : 0; };

  function paint(f) {
    const ring = clamp(Math.round(f), 1, Math.round(start));
    if (ring !== lastN) { lastN = ring; n.textContent = ring; if (scrub) scrub.value = ring; }
    const k = Math.floor(f);
    if (k !== lastK) {
      lastK = k;
      ticks.forEach((t, i) => t.classList.toggle('is-out', i + 1 > f));
      marks.forEach(m => { const le = m.dataset.le, ge = m.dataset.ge; m.classList.toggle('on', (le ? f <= +le : true) && (ge ? f >= +ge : true)); });
    }
    if (tag) {
      const show = f >= 1 && f <= northRings;
      tag.classList.toggle('is-hidden', !show);
      if (show) {
        const i = Math.min(northRings - 1, Math.floor(f)), fr = f - i;
        const y = i === 0 ? pith[1] + (ringY[0] - pith[1]) * fr : ringY[i - 1] + (ringY[i] - ringY[i - 1]) * fr;
        tag.setAttribute('transform', 'translate(' + pith[0] + ' ' + y.toFixed(1) + ')');
        tagText.textContent = 'RING ' + Math.round(f);
      }
    }
  }

  let stage;
  const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 300));
  const begin = () => { stage = createStage(host, {
    start, tmax,
    photos: ['/img/disc-640.webp', '/img/disc-900.webp', '/img/disc-1400.webp', '/img/disc-2200.webp'],
    rings: '/img/rings.png',
    onFront: paint,
    onReady() { setup(); },
    onFail() { root.classList.add('no-gl'); root.classList.remove('pin'); },
  }); };
  // the poster is the LCP: leave the network to it, start the renderer once the page has loaded and gone idle
  if (document.readyState === 'complete') idle(begin); else addEventListener('load', () => idle(begin), { once: true });

  function fromScroll() {
    const p = progress();
    stage.setFront(frontFor(p));
    if (cue) cue.classList.toggle('is-gone', p > .02);
  }
  function setup() {
    if (!reduce.matches) {
      pinned = true; root.classList.add('pin');
      fromScroll();
      let tick = false;
      addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; if (pinned) fromScroll(); }); } }, { passive: true });
      addEventListener('resize', () => { if (pinned) fromScroll(); }, { passive: true });
    }
    if (scrub) scrub.addEventListener('input', () => stage.setFront(+scrub.value));
    reduce.addEventListener('change', () => { pinned = !reduce.matches; root.classList.toggle('pin', pinned); if (pinned) fromScroll(); else stage.jump(start); });
    if (fine.matches && !reduce.matches && wrap) {
      wrap.addEventListener('pointermove', (e) => { const r = wrap.getBoundingClientRect(); stage.setLamp((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: true });
      wrap.addEventListener('pointerleave', () => stage.fadeLamp());
    }
    new IntersectionObserver(([e]) => stage.setVisible(e.isIntersecting), { rootMargin: '120px' }).observe(hero.querySelector('.hero__stage'));
  }
}
