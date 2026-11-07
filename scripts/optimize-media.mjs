// Ripley Safaris — media pipeline.
// Reads ORIGINAL photos from /img (never modified) and writes responsive AVIF/WebP/JPEG sets
// to /public/media/img, plus web-ready MP4 + poster for each video clip.
// Rules: never upscale, never aggressively compress, honour EXIF rotation, keep natural colour.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const SRC = 'img';
const OUT = 'public/media';
const WIDTHS = [480, 800, 1280, 1920, 2560];
const force = process.argv.includes('--force');
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);

const slug = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every source photograph that the site uses. The id is what pages reference.
function collect() {
  const list = new Map();
  const add = (file, id) => { if (fs.existsSync(path.join(SRC, file))) list.set(id || slug(path.basename(file)), file); };
  for (const f of fs.readdirSync(path.join(SRC, 'gallery/full'))) if (/\.(jpe?g|png|avif)$/i.test(f)) add('gallery/full/' + f);
  for (const f of fs.readdirSync(path.join(SRC, 'animals/full'))) if (/\.(jpe?g|png)$/i.test(f)) add('animals/full/' + f, 'sp-' + slug(f));
  for (const f of fs.readdirSync(path.join(SRC, 'lodge'))) add('lodge/' + f, 'lodge-' + slug(f));
  add('misc/nyt.jpg', 'lodge-night-entrance');
  return list;
}

async function processImage(id, file) {
  const input = path.join(SRC, file);
  const outDir = path.join(OUT, 'img');
  fs.mkdirSync(outDir, { recursive: true });
  const base = sharp(input, { failOn: 'none' }).rotate();
  const meta = await base.clone().metadata();
  const rotated = (meta.orientation || 1) >= 5;
  const W = rotated ? meta.height : meta.width, H = rotated ? meta.width : meta.height;
  // Widths smaller than the source, plus the source width itself when it is ≤ the cap (never upscale).
  let widths = WIDTHS.filter(w => w < W * 0.97);
  const top = Math.min(W, WIDTHS[WIDTHS.length - 1]);
  if (!widths.includes(top) && top > (widths.at(-1) || 0) * 1.08) widths.push(top);
  if (!widths.length) widths = [W];
  const stats = await base.clone().resize(16).stats();
  const [r, g, b] = stats.channels.map(c => Math.round(c.mean));
  const bg = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const jobs = [];
  for (const w of widths) {
    const resize = () => base.clone().resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });
    const name = `${id}-${w}`;
    const need = ext => force || !fs.existsSync(path.join(outDir, `${name}.${ext}`));
    if (need('avif')) jobs.push(resize().avif({ quality: 62, effort: 4, chromaSubsampling: '4:4:4' }).toFile(path.join(outDir, `${name}.avif`)));
    if (need('webp')) jobs.push(resize().webp({ quality: 84, effort: 5 }).toFile(path.join(outDir, `${name}.webp`)));
    // Single JPEG fallback near 1280 (or native width for small sources)
    if (w === (widths.find(x => x >= 1280) || widths.at(-1)) && need('jpg'))
      jobs.push(resize().jpeg({ quality: 86, mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${name}.jpg`)));
  }
  await Promise.all(jobs);
  const jpgW = widths.find(x => x >= 1280) || widths.at(-1);
  return { w: W, h: H, widths, jpg: jpgW, bg };
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-600));
}

function processVideos(manifest) {
  const dir = path.join(SRC, 'gallery/full');
  const outDir = path.join(OUT, 'video');
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(dir).filter(f => /\.mov$/i.test(f))) {
    const id = 'v-' + slug(f).replace(/^v-/, '').slice(0, 24);
    const mp4 = path.join(outDir, id + '.mp4');
    const poster = path.join(outDir, id + '.jpg');
    if (force || !fs.existsSync(mp4)) {
      // Portrait phone/drone clips: cap the short side at 720px, H.264 CRF 23, faststart for instant playback.
      run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', path.join(dir, f), '-vf', "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)'",
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
    }
    if (force || !fs.existsSync(poster))
      run(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', '0.6', '-i', path.join(dir, f), '-frames:v', '1', '-vf', "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)'", '-q:v', '3', poster]);
    manifest.videos['gallery/full/' + f] = { id, mp4: `/media/video/${id}.mp4`, poster: `/media/video/${id}.jpg`, size: fs.statSync(mp4).size };
    console.log('video', f, '→', (fs.statSync(mp4).size / 1048576).toFixed(1) + ' MB');
  }
}

const manifest = { images: {}, videos: {} };
const mpath = 'data/media-manifest.json';
const old = fs.existsSync(mpath) ? JSON.parse(fs.readFileSync(mpath, 'utf8')) : { images: {} };
for (const [id, file] of collect()) {
  if (only && !id.includes(only)) { manifest.images[id] = old.images[id]; continue; }
  try { manifest.images[id] = { ...(await processImage(id, file)), src: file }; process.stdout.write('.'); }
  catch (e) { console.error('\nFAILED', file, e.message); }
}
console.log();
processVideos(manifest);
fs.writeFileSync(mpath, JSON.stringify(manifest, null, 1));
const bytes = d => fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0);
console.log('images:', Object.keys(manifest.images).length, ' output:', (bytes(path.join(OUT, 'img')) / 1048576).toFixed(0), 'MB');
