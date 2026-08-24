/**
 * Rasterizes public/icons/icon.svg into the PNG set required for PWA
 * install prompts and iOS home-screen icons. Run once after changing the
 * source SVG:  node scripts/generate-icons.mjs
 *
 * Outputs (all committed to git):
 *   public/icons/icon-192.png      manifest icon (any)
 *   public/icons/icon-512.png      manifest icon (any)
 *   src/app/apple-icon.png         apple-touch-icon (iOS ignores SVG)
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("public/icons/icon.svg");

const targets = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  // iOS home screen; Apple applies its own corner mask.
  { file: "src/app/apple-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  const png = await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(file, png);
  console.log(`wrote ${file} (${size}x${size})`);
}
