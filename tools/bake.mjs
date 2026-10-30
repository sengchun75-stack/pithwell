/* Offline bake for the hero section: one photograph in, the stage assets out.
 *
 *   img/disc-640.webp, disc-900.webp, disc-1400.webp, disc-2200.webp - the photograph, graded,
 *                         square, metadata dropped. Poster and texture share the frame.
 *   img/rings.png       - ring number at every point of the frame, 384 square.
 *                         R holds the high 8 bits and the top nibble of G the low
 *                         4 bits of a 12-bit value: ring number / TMAX.
 *   img/loupe.webp      - a crop of the native frame, six rings at full detail
 *   img/core-1..3.webp  - three segments of the north radius laid flat as a core:
 *                         pith on the left, newest ring on the right
 *   tools/ring-data.json - pith position, ring boundaries along the north radius
 *
 * Rings are followed by phase. Along each of 720 rays leaving the pith the
 * brightness is band-passed to the ring frequency, the analytic signal gives a
 * continuous phase, and one turn of phase is one ring. A ray that drops or adds
 * a turn is pulled back to its neighbours' median. Nothing here draws a ring:
 * the numbers are measured from the pixels.
 *
 * usage: node bake.mjs <source-3000.jpg> <out-img-dir> [native-source.jpg]
 * needs: sharp (install it next to a working copy of this file; the site
 * carries no package.json).
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [src, out, native] = process.argv.slice(2);
const S = 1500;                    // analysis size
const PITH_UV = [0.5953, 0.4357];  // refined from the visible pith, see tools/ring-data.json
const A = 720, RMAX = 1400, NFFT = 2048, RLIM = 1300, MAP = 384;

const { data } = await sharp(src).resize(S, S).greyscale().raw().toBuffer({ resolveWithObject: true });
const g = Float32Array.from(data);
const PITH = [PITH_UV[0] * S, PITH_UV[1] * S];
const inside = (x, y) => x >= 0 && y >= 0 && x < S - 1 && y < S - 1;
const at = (x, y) => { const x0 = Math.trunc(x), y0 = Math.trunc(y), fx = x - x0, fy = y - y0, i = y0 * S + x0; return g[i] * (1 - fx) * (1 - fy) + g[i + 1] * fx * (1 - fy) + g[i + S] * (1 - fx) * fy + g[i + S + 1] * fx * fy; };

function fft(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = 2 * Math.PI / len * (inv ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const a = i + j, b = i + j + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
function gauss(arr, sigma) {
  const k = Math.ceil(sigma * 3), w = []; let s = 0;
  for (let i = -k; i <= k; i++) { const v = Math.exp(-i * i / (2 * sigma * sigma)); w.push(v); s += v; }
  const n = arr.length, o = new Float32Array(n);
  for (let i = 0; i < n; i++) { let a = 0; for (let j = -k; j <= k; j++) a += arr[Math.min(n - 1, Math.max(0, i + j))] * w[j + k]; o[i] = a / s; }
  return o;
}
const med = (arr) => { arr.sort((x, y) => x - y); return arr[arr.length >> 1]; };

// phase along every ray
const tau = new Float32Array(A * RMAX), valid = new Int32Array(A);
for (let a = 0; a < A; a++) {
  const th = a / A * 2 * Math.PI, ct = Math.cos(th), st = Math.sin(th);
  const p = new Float32Array(RMAX); let rEnd = RMAX;
  for (let r = 0; r < RMAX; r++) {
    const x = PITH[0] + r * ct, y = PITH[1] + r * st;
    if (!inside(x, y)) { rEnd = r; break; }
    let v = 0;
    for (let k = -2; k <= 2; k++) { const t2 = th + k * 0.0035; v += at(Math.min(S - 1.01, Math.max(0, PITH[0] + r * Math.cos(t2))), Math.min(S - 1.01, Math.max(0, PITH[1] + r * Math.sin(t2)))); }
    p[r] = v / 5;
  }
  for (let r = rEnd; r < RMAX; r++) p[r] = p[Math.max(0, rEnd - 1)];
  const lo = gauss(p, 1.8), hi = gauss(p, 7.5);
  const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (let r = 0; r < RMAX; r++) re[r] = (lo[r] - hi[r]) * (r < 25 ? r / 25 : 1);
  fft(re, im, false);
  for (let k = 0; k < NFFT; k++) { const m = k === 0 || k === NFFT / 2 ? 1 : (k < NFFT / 2 ? 2 : 0); re[k] *= m; im[k] *= m; }
  fft(re, im, true);
  let prev = 0, acc = 0;
  for (let r = 0; r < RMAX; r++) {
    const ph = Math.atan2(im[r], re[r]);
    if (r > 0) { let d = ph - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; } else acc = ph;
    prev = ph; tau[a * RMAX + r] = acc / (2 * Math.PI);
  }
  valid[a] = rEnd;
}
let slope = 0; for (let a = 0; a < A; a++) slope += tau[a * RMAX + 300] - tau[a * RMAX + 100];
if (slope < 0) for (let i = 0; i < tau.length; i++) tau[i] = -tau[i];

// pull slipped rays back to the circular median of their neighbours, marching outward
const off = new Float32Array(A);
{ const vals = []; for (let a = 0; a < A; a++) vals.push(tau[a * RMAX + 40]); const m = med(vals.slice()); for (let a = 0; a < A; a++) off[a] = -Math.round(tau[a * RMAX + 40] - m); }
const corr = new Float32Array(A * RMAX);
for (let r = 0; r < RLIM; r++) {
  const col = new Float32Array(A); for (let a = 0; a < A; a++) col[a] = tau[a * RMAX + r] + off[a];
  for (let a = 0; a < A; a++) {
    const nb = []; for (let k = -9; k <= 9; k++) nb.push(col[(a + k + A) % A]);
    const d = col[a] - med(nb);
    if (Math.abs(d) > 0.65 && r > 30 && r < valid[a] - 5) { const c = Math.round(d); off[a] -= c; col[a] -= c; }
    corr[a * RMAX + r] = col[a];
  }
}
let tauIn = 0; for (let a = 0; a < A; a++) tauIn += corr[a * RMAX + 20]; tauIn /= A;
const sm = new Float32Array(A * RMAX);
for (let r = 0; r < RLIM; r++) for (let a = 0; a < A; a++) { let s = 0; for (let k = -3; k <= 3; k++) s += corr[((a + k + A) % A) * RMAX + r]; sm[a * RMAX + r] = s / 7 - tauIn; }

// ring number at a point of the frame
function tauAtUV(u, v) {
  const dx = u * S - PITH[0], dy = v * S - PITH[1], r = Math.min(RLIM - 2, Math.hypot(dx, dy));
  let th = Math.atan2(dy, dx); if (th < 0) th += 2 * Math.PI;
  const af = th / (2 * Math.PI) * A, a0 = Math.floor(af) % A, a1 = (a0 + 1) % A, fa = af - Math.floor(af), r0 = Math.floor(r), fr = r - r0;
  const s = (a) => sm[a * RMAX + r0] * (1 - fr) + sm[a * RMAX + r0 + 1] * fr;
  return Math.max(0, s(a0) * (1 - fa) + s(a1) * fa);
}
const map = new Float32Array(MAP * MAP); let tmax = 0, tDisc = 0;
for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
  const u = (x + 0.5) / MAP, v = (y + 0.5) / MAP, t = tauAtUV(u, v); map[y * MAP + x] = t;
  const rr = Math.hypot(u - 0.5, v - 0.5);
  if (rr < 0.5 && t > tmax) tmax = t;
  if (rr < 0.44 && t > tDisc) tDisc = t;   // the part of the frame the page leaves visible
}
const TMAX = Math.ceil(tmax) + 1;
const blur = (arr) => { const o = new Float32Array(arr.length); for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) { let s = 0, n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP) { s += arr[yy * MAP + xx]; n++; } } o[y * MAP + x] = s / n; } return o; };
const tm = blur(blur(map));
const png = Buffer.alloc(MAP * MAP * 3);
for (let i = 0; i < MAP * MAP; i++) { const v = Math.round(Math.min(1, Math.max(0, tm[i] / TMAX)) * 4095); png[i * 3] = v >> 4; png[i * 3 + 1] = (v & 15) << 4; }
await sharp(png, { raw: { width: MAP, height: MAP, channels: 3 } }).png({ compressionLevel: 9 }).toFile(join(out, 'rings.png'));

// ring boundaries along the north radius, as fractions of the frame
const aN = Math.round(270 / 360 * A) % A, ticks = []; let k = 1;
for (let r = 1; r < valid[aN] - 4; r++) {
  const t = sm[aN * RMAX + r];
  while (t >= k) { const t0 = sm[aN * RMAX + r - 1], rr = r - 1 + (k - t0) / (t - t0); ticks.push({ ring: k, v: +((PITH[1] - rr) / S).toFixed(5) }); k++; }
}
writeFileSync(join(out, '..', '..', 'tools', 'ring-data.json'), JSON.stringify({ pithUV: PITH_UV, tmax: TMAX, northRings: ticks.length, maxRing: Math.floor(tDisc - 0.5), northU: PITH_UV[0], ticks }, null, 1));

// graded photograph. Same grade for poster and texture, so the first canvas frame matches the poster.
const grade = (img) => img.modulate({ saturation: 0.84, brightness: 0.96 }).linear(1.05, -5);
for (const [w, q] of [[640, 64], [900, 64], [1400, 66], [2200, 64]]) await grade(sharp(src).resize(w, w)).webp({ quality: q, effort: 6 }).toFile(join(out, `disc-${w}.webp`));
if (native) {
  const m = await sharp(native).metadata(); const f = m.width / S;
  await grade(sharp(native).extract({ left: Math.round(PITH[0] * f - 360), top: Math.round((PITH[1] - 560) * f), width: 720, height: 480 })).webp({ quality: 76, effort: 6 }).toFile(join(out, 'loupe.webp'));
}
if (native) {
  const m = await sharp(native).metadata(); const f = m.width;      // native frame is square
  const x = Math.round(PITH_UV[0] * f);
  for (const [i, [r0, r1]] of [[1, 20], [10, 29], [19, 38]].entries()) {
    const y0 = Math.round(ticks[r1 - 1].v * f), y1 = Math.round(ticks[r0 - 1].v * f);
    await grade(sharp(native).extract({ left: x - 35, top: y0, width: 70, height: y1 - y0 }).rotate(90)).webp({ quality: 74, effort: 6 }).toFile(join(out, `core-${i + 1}.webp`));
  }
}
console.log(JSON.stringify({ TMAX, northRings: ticks.length, maxRing: Math.floor(tDisc - 0.5) }));
