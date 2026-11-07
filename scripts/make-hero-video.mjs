// Hero film: re-encodes the supplied portrait clip (img/hero/herofull.mp4, 1080×1920, 35 MB) for the web.
//  · starts after the black lead-in, silent (the hero is muted anyway)
//  · hero-720.mp4  → phones (full-bleed 9:16, native proportions)
//  · hero-1080.mp4 → tablets / desktops (full-bleed, shows a horizontal slice of the portrait frame, so it keeps the clip's full 1080 px width)
//  · poster frame (identical to the first video frame) as AVIF / WebP / JPEG so the hero paints instantly
// Run: npm run hero
import fs from 'fs';
import sharp from 'sharp';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const SRC = 'img/hero/herofull.mp4';
const OUT = 'public/media/hero';
const START = '2.0'; // seconds: skips the black fade-in at the start of the original
fs.mkdirSync(OUT, { recursive: true });
const run = args => { const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', ...args], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr); };

run(['-ss', START, '-i', SRC, '-an', '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/hero-720.mp4`]);
run(['-ss', START, '-i', SRC, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/hero-1080.mp4`]);
run(['-ss', START, '-i', SRC, '-frames:v', '1', '-q:v', '2', `${OUT}/_frame.png`]);

for (const w of [720, 1080]) {
  const base = () => sharp(`${OUT}/_frame.png`).resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });
  await base().avif({ quality: 62, effort: 4, chromaSubsampling: '4:4:4' }).toFile(`${OUT}/poster-${w}.avif`);
  await base().webp({ quality: 84 }).toFile(`${OUT}/poster-${w}.webp`);
  if (w === 1080) await base().jpeg({ quality: 86, mozjpeg: true, progressive: true }).toFile(`${OUT}/poster-${w}.jpg`);
}
fs.unlinkSync(`${OUT}/_frame.png`);
for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(18), (fs.statSync(`${OUT}/${f}`).size / 1024 / 1024).toFixed(2) + ' MB');
