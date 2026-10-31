/* Offline render of the page-wide backdrop: a 12 second seamless loop made from the one photograph.
 *
 *   video/loop.webm - VP9, 1920 x 1080, 24 fps
 *   video/loop.mp4  - H.264, same frames, for browsers without VP9
 *   img/wood-still.webp - frame 0, shown before the clip arrives and when it never plays
 *
 * The camera drifts around the pith on a closed path (one slow orbit, a figure-eight in y, a 4.5% breathing
 * zoom), so the last frame leads straight back into the first. Every frame is the photograph at native
 * detail, dimmed by half; nothing is drawn or generated. Frames are drawn on a canvas in headless Chromium
 * and recorded with MediaRecorder, so no ffmpeg is needed.
 *
 * The encoder runs in real time, so the file sizes (about 1.6 to 2.9 MB for the WebM) vary from run to run.
 *
 * usage: node loop.mjs <photo-3600.jpg> <out-dir>
 * make the 3600 px square from the native file first, for example
 *   sharp(native).resize(3600, 3600).jpeg({ quality: 88 })
 * needs: playwright-core and a Chromium (set CHROMIUM to its path). The still is cut from still.png with
 * sharp: resize(1024, 576).webp({ quality: 34 }).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const [photo, out] = process.argv.slice(2);
const T = 12, FPS = 24;                 // seconds, frames per second
const PITH = [2000, 1569];              // orbit centre in the 3600 px frame (the pith sits near 2143, 1569)
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent('<canvas id=c width=1920 height=1080></canvas>');
const url = 'data:image/jpeg;base64,' + readFileSync(photo).toString('base64');
const res = await p.evaluate(async ({ url, T, FPS, PITH }) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.getElementById('c'), x = c.getContext('2d');
  const draw = (t) => {
    const ph = 2 * Math.PI * t / T;
    const cx = PITH[0] + 250 * Math.cos(ph), cy = PITH[1] + 200 * Math.sin(2 * ph);
    const vw = 2300 * (1 + 0.045 * Math.sin(ph)), vh = vw * 9 / 16;
    x.drawImage(img, cx - vw / 2, cy - vh / 2, vw, vh, 0, 0, 1920, 1080);
    x.fillStyle = 'rgba(10,12,10,.5)'; x.fillRect(0, 0, 1920, 1080);
  };
  draw(0);
  const still = c.toDataURL('image/png');
  const track = c.captureStream(0).getVideoTracks()[0], stream = new MediaStream([track]);
  const files = {};
  for (const [name, mime, bps] of [['webm', 'video/webm;codecs=vp9', 1500000], ['mp4', 'video/mp4;codecs=avc1', 1800000]]) {
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps }), chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise(r => { rec.onstop = r; });
    draw(0); rec.start();
    const t0 = performance.now(); let f = 0;
    await new Promise(end => { const step = () => { const t = f / FPS; if (t >= T) return end(); draw(t); track.requestFrame(); f++; setTimeout(step, Math.max(0, t0 + (f / FPS) * 1000 - performance.now())); }; step(); });
    rec.stop(); await done;
    const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    files[name] = btoa(s);
  }
  return { still, ...files };
}, { url, T, FPS, PITH });
writeFileSync(join(out, 'loop.webm'), Buffer.from(res.webm, 'base64'));
writeFileSync(join(out, 'loop.mp4'), Buffer.from(res.mp4, 'base64'));
writeFileSync(join(out, 'still.png'), Buffer.from(res.still.split(',')[1], 'base64'));
await b.close();
