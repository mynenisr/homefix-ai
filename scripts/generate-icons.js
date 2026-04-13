// Generates PWA icons from SVG source
// Run: node scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// HomeFix AI icon — navy background, white house, teal accent
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="#1E2761"/>

  <!-- House body -->
  <rect x="156" y="272" width="200" height="160" rx="8" fill="white"/>

  <!-- House roof -->
  <polygon points="256,120 136,280 376,280" fill="#0D7DB5"/>

  <!-- Door -->
  <rect x="218" y="340" width="76" height="92" rx="6" fill="#1E2761"/>
  <circle cx="286" cy="390" r="6" fill="#CADCFC"/>

  <!-- Left window -->
  <rect x="170" y="295" width="52" height="40" rx="4" fill="#CADCFC"/>
  <line x1="196" y1="295" x2="196" y2="335" stroke="#1E2761" stroke-width="3"/>
  <line x1="170" y1="315" x2="222" y2="315" stroke="#1E2761" stroke-width="3"/>

  <!-- Right window -->
  <rect x="290" y="295" width="52" height="40" rx="4" fill="#CADCFC"/>
  <line x1="316" y1="295" x2="316" y2="335" stroke="#1E2761" stroke-width="3"/>
  <line x1="290" y1="315" x2="342" y2="315" stroke="#1E2761" stroke-width="3"/>

  <!-- AI spark -->
  <circle cx="376" cy="150" r="36" fill="#0D7DB5"/>
  <text x="376" y="160" font-family="Arial Black,Arial" font-size="28" font-weight="900"
        fill="white" text-anchor="middle">AI</text>
</svg>`;

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32,  name: 'favicon-32.png' },
  { size: 16,  name: 'favicon-16.png' },
];

(async () => {
  for (const { size, name } of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, name));
    console.log(`✅ Generated ${name} (${size}x${size})`);
  }
  console.log('\nAll icons written to public/icons/');
})();
