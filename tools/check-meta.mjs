/* Fails if any served image carries EXIF, XMP, IPTC or an ICC profile.
 *
 * usage: node check-meta.mjs <docs/img folder>
 * needs: sharp, installed next to a working copy of this file.
 */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const dir = process.argv[2].replace(/\/?$/, '/');
let bad = 0;
for (const f of readdirSync(dir).filter(f => /\.(webp|png|jpe?g)$/.test(f))) {
  const m = await sharp(dir + f).metadata();
  const has = ['exif', 'xmp', 'icc', 'iptc', 'tifftagPhotoshop'].filter(k => m[k]);
  if (has.length) { bad++; console.log('metadata in', f, has.join(',')); }
}
console.log(bad ? `${bad} file(s) carry metadata` : 'no EXIF, XMP, ICC or IPTC in any served image');
process.exit(bad ? 1 : 0);
