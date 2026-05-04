import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'icon.svg');

if (!existsSync(svgPath)) {
  console.error('icon.svg not found at', svgPath);
  process.exit(1);
}

const svg = readFileSync(svgPath);

const icons = [
  { name: 'logo.png', size: 64 },
  { name: 'logo-192.png', size: 192 },
  { name: 'logo-512.png', size: 512 },
];

for (const { name, size } of icons) {
  const out = join(publicDir, name);
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log('Done.');
