// Generates the Android launcher icons, the splash screens and the Google Play icon from the SVG files in brand/.
// Run once after a change of logo: npm install --no-save sharp && node scripts/android/icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const res = path.join(repo, 'android/app/src/main/res');
const TILE = '#141414';
const SPLASH = '#0A3D2E';

const appIcon = fs.readFileSync(path.join(repo, 'brand/DJALUMO_icone-app_sombre.svg'), 'utf8');
const mark = appIcon.replace(/<rect[^>]*\/>/, '');
const wordmark = fs.readFileSync(path.join(repo, 'brand/DJALUMO-AGRO_couleur-fond-sombre.svg'), 'utf8');

const vbWidth = (svg) => +svg.match(/viewBox="[^"]*?([\d.]+)\s+[\d.]+"/)[1];
const raster = (svg, w) => sharp(Buffer.from(svg), { density: Math.min(2400, 72 * w * 1.2 / vbWidth(svg)), limitInputPixels: false }).resize({ width: w }).png().toBuffer();
async function trimmed(svg, w) { return sharp(await raster(svg, w)).trim({ threshold: 1 }).png().toBuffer(); }

async function place(content, size, bg, ratio, round) {
  const inner = await sharp(content).resize({ width: Math.round(size * ratio), height: Math.round(size * ratio), fit: 'inside' }).png().toBuffer();
  const base = sharp({ create: { width: size, height: size, channels: 4, background: bg || { r: 0, g: 0, b: 0, alpha: 0 } } });
  const layers = [{ input: inner, gravity: 'center' }];
  if (round) layers.push({ input: Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`), blend: 'dest-in' });
  return base.composite(layers).png().toBuffer();
}

const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const content = await trimmed(mark, 2048);
for (const [d, k] of Object.entries(DENS)) {
  const dir = path.join(res, 'mipmap-' + d);
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), await raster(appIcon, 48 * k));
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), await place(content, 48 * k, TILE, 0.6, true));
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), await place(content, 108 * k, null, 0.56));
}

const word = await trimmed(wordmark, 3000);
const splashes = fs.readdirSync(res).filter((d) => d.startsWith('drawable')).map((d) => path.join(res, d, 'splash.png')).filter((f) => fs.existsSync(f));
for (const f of splashes) {
  const { width, height } = await sharp(f).metadata();
  const w = Math.round(Math.min(width, height) * 0.62);
  const logo = await sharp(word).resize({ width: w }).png().toBuffer();
  await sharp({ create: { width, height, channels: 3, background: SPLASH } }).composite([{ input: logo, gravity: 'center' }]).png().toFile(f + '.tmp');
  fs.renameSync(f + '.tmp', f);
}

const play = path.join(repo, 'android/play');
fs.mkdirSync(play, { recursive: true });
fs.writeFileSync(path.join(play, 'icon-512.png'), await place(content, 512, TILE, 0.62));
const fw = await sharp(word).resize({ width: 640 }).png().toBuffer();
await sharp({ create: { width: 1024, height: 500, channels: 3, background: SPLASH } }).composite([{ input: fw, gravity: 'center' }]).png().toFile(path.join(play, 'feature-graphic.png'));
console.log(`icons: ${Object.keys(DENS).length} densities, splash: ${splashes.length} files, Google Play: icon and feature graphic`);
