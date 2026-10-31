// Wood backdrops. Once the page has loaded and gone idle the still frame is revealed and the section images start
// to arrive; the looping clip
// is fetched after that, never for reduced motion or a data-saver connection, and is paused while the
// home hero (which covers it) is on screen.
const bg = document.querySelector('.bg');
const v = document.querySelector('.bg__v');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const conn = navigator.connection || {};
const lean = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

if (bg && v) {
  const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 500));
  const pick = () => (v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.webm : v.canPlayType('video/mp4; codecs="avc1.42E01E"') ? v.dataset.mp4 : '');
  let hidden = false;
  const sync = () => { if (hidden || reduce.matches) v.pause(); else v.play().catch(() => {}); };
  // each section's own backdrop is fetched as it nears the viewport, and fades in once it has arrived
  const sections = () => {
    const show = (el) => { const im = new Image(); im.onload = () => { el.style.backgroundImage = 'url(' + el.dataset.src + ')'; el.classList.add('on'); }; im.src = el.dataset.src; };
    const imgs = [...document.querySelectorAll('.sec__bg[data-src]')];
    if (!('IntersectionObserver' in window)) { imgs.forEach(show); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }), { rootMargin: '1200px 0px' });
    const start = () => { ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'].forEach((t) => removeEventListener(t, start)); imgs.forEach((i) => io.observe(i)); };
    // wait for the first scroll or tap: until then the page-wide still sits behind the first screen, and a large image
    // arriving late would count as the largest paint
    if (scrollY > 0) start(); else ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'].forEach((t) => addEventListener(t, start, { passive: true }));
  };
  const clip = () => {
    const src = pick();
    if (!src) return;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    v.src = src;
    sync();
    const stage = document.querySelector('.hero__stage');
    if (stage) new IntersectionObserver(([e]) => { hidden = e.isIntersecting; sync(); }).observe(stage);
    reduce.addEventListener('change', () => { if (reduce.matches) v.classList.remove('on'); sync(); });
  };
  const begin = () => {
    bg.classList.add('ready');
    if (!lean) sections();
    if (!reduce.matches && !lean) setTimeout(clip, 600);
  };
  if (document.readyState === 'complete') idle(begin); else addEventListener('load', () => idle(begin), { once: true });
}
