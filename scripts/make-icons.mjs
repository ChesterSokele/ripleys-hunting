// Generates favicon, apple-touch-icon and the 1200×630 social-share image from the supplied logo + a reserve photograph.
import sharp from 'sharp';

const logo = 'logo-icon-transparent.png';
// The supplied logo is black on transparent: tint it ivory for use on dark backgrounds.
const ivory = async h => sharp(logo).resize({ height: h }).ensureAlpha().linear([0, 0, 0, 1], [244, 237, 220, 0]).png().toBuffer();

async function tile(size, file) {
  const mark = await ivory(Math.round(size * 0.66));
  await sharp({ create: { width: size, height: size, channels: 4, background: '#1c3024' } })
    .composite([{ input: mark, gravity: 'center' }]).png().toFile(file);
}
await tile(256, 'public/favicon.png');
await tile(180, 'public/apple-touch-icon.png');

const W = 1200, H = 630;
const photo = await sharp('img/gallery/full/image00245.jpeg').rotate().resize(W, H, { fit: 'cover', position: sharp.strategy.attention }).toBuffer();
const shade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.25" stop-color="#080b09" stop-opacity="0"/><stop offset="1" stop-color="#080b09" stop-opacity="0.92"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>
<text x="64" y="520" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="#f4eddc" letter-spacing="1">Leave Your Footprint in Africa</text>
<text x="66" y="575" font-family="Arial, sans-serif" font-size="26" fill="#dcb878" letter-spacing="8">RIPLEY SAFARIS · SOUTH AFRICA</text></svg>`);
const mark = await ivory(120);
await sharp(photo).composite([{ input: shade }, { input: mark, left: 64, top: 48 }]).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-image.jpg');
console.log('icons + og-image written');
