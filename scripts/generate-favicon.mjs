#!/usr/bin/env node
/**
 * Generates a static favicon.ico file that matches the navbar logo
 * (solid emerald-500 square with white Activity heartbeat icon).
 *
 * Output: public/favicon.ico (ICO v2 format with a 32x32 PNG inside,
 * which modern browsers, GitHub, and OGP scrapers all accept).
 *
 * Run with: node scripts/generate-favicon.mjs
 */

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '..', 'public', 'favicon.ico');

// SVG source — solid emerald square with white Activity icon (lucide "activity")
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#10B981"/>
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

// Render the SVG to a 32x32 PNG buffer
const pngBuffer = await sharp(Buffer.from(svg))
  .resize(32, 32)
  .png()
  .toBuffer();

// Wrap the PNG inside an ICO container (ICO v2 supports embedded PNGs)
//
// Layout:
//   ICONDIR    (6 bytes)  = 00 00 01 00 01 00
//   ICONDIRENTRY (16 bytes)
//   PNG data
const pngSize = pngBuffer.length;
const headerSize = 6 + 16; // ICONDIR + one ICONDIRENTRY

const ico = Buffer.alloc(headerSize + pngSize);

// ICONDIR
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: 1 = icon
ico.writeUInt16LE(1, 4); // image count

// ICONDIRENTRY (first and only entry)
ico.writeUInt8(32, 6);   // width (0 means 256)
ico.writeUInt8(32, 7);   // height (0 means 256)
ico.writeUInt8(0, 8);    // color palette count (0 = no palette)
ico.writeUInt8(0, 9);    // reserved
ico.writeUInt16LE(1, 10); // color planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(pngSize, 14); // PNG size in bytes
ico.writeUInt32LE(headerSize, 18); // offset to PNG data

// Append the PNG
pngBuffer.copy(ico, headerSize);

await writeFile(OUTPUT, ico);

console.log(`✔ Wrote ${OUTPUT} (${ico.length} bytes, PNG inside: ${pngSize} bytes)`);
