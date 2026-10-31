/* Offline bake of the per-section backdrops: nineteen different crops of the one photograph, one for each
 * content section. Zoom, rotation, mirroring and tint all vary so that neighbouring sections do not look
 * alike. Each is dimmed to half brightness here; the page puts a scrim over it. Nothing is generated.
 *
 *   img/sec-1..19.webp - 1280 x 720
 *
 * usage: node sections.mjs <native-source.jpg> <out-img-dir>
 * needs: sharp, installed next to a working copy of this file.
 */
import sharp from 'sharp';
import { join } from 'node:path';

const [native, out] = process.argv.slice(2);
const N = 5381;                          // the photograph is square
// centre x, centre y, crop width in native pixels, rotation, mirrored, tint (0 warm, 1 ash, 2 cambium green)
const SECS = [
  [1200, 1000, 2400, 0, 0, 0], [4300, 900, 1700, 90, 0, 1], [800, 2800, 3000, 0, 1, 2], [4600, 2600, 1500, 180, 0, 0],
  [2100, 4300, 2200, 270, 0, 1], [3800, 4600, 2600, 0, 1, 2], [1500, 1700, 1400, 90, 1, 0], [2800, 800, 3200, 180, 0, 1],
  [4800, 4300, 1800, 0, 0, 0], [600, 4500, 2000, 270, 1, 2], [3300, 3400, 1400, 0, 0, 1], [2000, 2500, 2800, 180, 1, 0],
  [4200, 1700, 2200, 90, 0, 2], [1100, 3600, 1600, 0, 1, 1], [3000, 1300, 1500, 270, 0, 0], [4700, 3500, 2600, 180, 0, 2],
  [2500, 3700, 1700, 90, 1, 0], [1800, 700, 2000, 0, 0, 1], [3600, 2000, 1500, 180, 1, 2],
];
for (const [i, [cx, cy, w, rot, flip, tint]] of SECS.entries()) {
  const h = Math.round(w * 9 / 16), odd = rot % 180 === 90, ew = odd ? h : w, eh = odd ? w : h;
  const left = Math.round(Math.min(N - ew, Math.max(0, cx - ew / 2))), top = Math.round(Math.min(N - eh, Math.max(0, cy - eh / 2)));
  let img = sharp(native).extract({ left, top, width: ew, height: eh });
  if (rot) img = img.rotate(rot);
  if (flip) img = img.flop();
  img = img.resize(1280, 720, { fit: 'cover' }).blur(0.8);
  img = tint === 1 ? img.modulate({ saturation: 0.3 }) : tint === 2 ? img.tint({ r: 150, g: 168, b: 84 }) : img.modulate({ saturation: 0.9 });
  await img.linear(0.5, 0).webp({ quality: 32, effort: 6 }).toFile(join(out, `sec-${i + 1}.webp`));
}
console.log(SECS.length + ' written');
