#!/usr/bin/env node
/**
 * Generates all static favicon/icon assets that match the navbar logo
 * (solid emerald-500 square with white Activity heartbeat icon).
 *
 * Outputs:
 *   public/favicon.ico           — ICO v2 with 32x32 PNG inside
 *   public/apple-touch-icon.png  — 180x180 for iOS
 *   public/icon-192.png          — 192x192 for Android / PWA
 *   public/icon-512.png          — 512x512 for high-DPI / PWA splash
 *   public/og-image.png          — 1200x630 social share
 *
 * Run with: npm run generate-favicon
 */

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');

// Logo SVG — matches navbar: solid emerald square with white Activity icon.
// We use a 32x32 viewBox and scale up when rendering larger icons.
function logoSvg(radiusPct = 0.22) {
  const size = 32;
  const r = Math.round(size * radiusPct);
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#10B981"/>
  <path
    d="M28 16h-5l-3.75 11.25L12.25 4.75 8.5 16H4"
    fill="none"
    stroke="white"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`.trim();
}

// Render the logo to a PNG buffer at the requested size.
async function renderLogo(size, radiusPct = 0.22) {
  return sharp(Buffer.from(logoSvg(radiusPct)))
    .resize(size, size)
    .png()
    .toBuffer();
}

// Wrap a PNG buffer inside an ICO v2 container.
// Layout: ICONDIR(6) + ICONDIRENTRY(16) + PNG data.
function pngToIco(pngBuffer, width, height) {
  const pngSize = pngBuffer.length;
  const headerSize = 6 + 16;
  const ico = Buffer.alloc(headerSize + pngSize);

  // ICONDIR
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // type: 1 = icon
  ico.writeUInt16LE(1, 4); // image count

  // ICONDIRENTRY
  ico.writeUInt8(width === 256 ? 0 : width, 6);
  ico.writeUInt8(height === 256 ? 0 : height, 7);
  ico.writeUInt8(0, 8); // palette count
  ico.writeUInt8(0, 9); // reserved
  ico.writeUInt16LE(1, 10); // color planes
  ico.writeUInt16LE(32, 12); // bits per pixel
  ico.writeUInt32LE(pngSize, 14);
  ico.writeUInt32LE(headerSize, 18);

  pngBuffer.copy(ico, headerSize);
  return ico;
}

// Render the OpenGraph social share card (1200x630).
// Dark background with the logo + headline.
async function renderOgImage() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.25"/>
      <stop offset="40%" stop-color="#0EA5E9" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0A0A0A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="headline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0A0A0A"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo block -->
  <rect x="80" y="80" width="72" height="72" rx="16" fill="#10B981"/>
  <g transform="translate(80, 80)">
    <path
      d="M62 36h-12l-9 26.5L26.5 7 18 36H8"
      fill="none"
      stroke="white"
      stroke-width="6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
  <text x="180" y="115" fill="white" font-family="Inter, -apple-system, sans-serif" font-size="36" font-weight="700">Webmaster</text>
  <text x="180" y="145" fill="#71717A" font-family="Inter, -apple-system, sans-serif" font-size="14" letter-spacing="3">MONITOR</text>

  <!-- Headline -->
  <text x="80" y="300" fill="white" font-family="Inter, -apple-system, sans-serif" font-size="72" font-weight="800" letter-spacing="-2">Monitora ogni sito.</text>
  <text x="80" y="380" fill="url(#headline)" font-family="Inter, -apple-system, sans-serif" font-size="72" font-weight="800" letter-spacing="-2">Intervieni prima.</text>

  <!-- Subtitle -->
  <text x="80" y="450" fill="#A1A1AA" font-family="Inter, -apple-system, sans-serif" font-size="26">Uptime, SSL, performance e notifiche in tempo reale per</text>
  <text x="80" y="485" fill="#A1A1AA" font-family="Inter, -apple-system, sans-serif" font-size="26">webmaster e agenzie.</text>

  <!-- URL -->
  <text x="80" y="570" fill="#52525B" font-family="Inter, -apple-system, sans-serif" font-size="20">webmaster-monitor.it</text>
</svg>
  `.trim();

  return sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png()
    .toBuffer();
}

async function main() {
  // 1. 32x32 PNG, wrapped in ICO container
  const png32 = await renderLogo(32);
  const ico = pngToIco(png32, 32, 32);
  await writeFile(resolve(PUBLIC, 'favicon.ico'), ico);
  console.log(`✔ public/favicon.ico (${ico.length} bytes)`);

  // 2. 180x180 PNG for iOS (apple-touch-icon.png)
  const png180 = await renderLogo(180);
  await writeFile(resolve(PUBLIC, 'apple-touch-icon.png'), png180);
  console.log(`✔ public/apple-touch-icon.png (${png180.length} bytes)`);

  // 3. 192x192 PNG for Android / PWA
  const png192 = await renderLogo(192);
  await writeFile(resolve(PUBLIC, 'icon-192.png'), png192);
  console.log(`✔ public/icon-192.png (${png192.length} bytes)`);

  // 4. 512x512 PNG for high-DPI / PWA splash
  const png512 = await renderLogo(512);
  await writeFile(resolve(PUBLIC, 'icon-512.png'), png512);
  console.log(`✔ public/icon-512.png (${png512.length} bytes)`);

  // 5. 1200x630 OpenGraph social share card
  const og = await renderOgImage();
  await writeFile(resolve(PUBLIC, 'og-image.png'), og);
  console.log(`✔ public/og-image.png (${og.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
