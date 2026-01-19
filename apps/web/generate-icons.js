const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, 'public', 'icon.svg'));

async function generateIcons() {
  // Generate 192x192 icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-192x192.png'));

  console.log('✅ Generated icon-192x192.png');

  // Generate 512x512 icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-512x512.png'));

  console.log('✅ Generated icon-512x512.png');

  // Generate apple-touch-icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

  console.log('✅ Generated apple-touch-icon.png');

  // Generate favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public', 'favicon-32x32.png'));

  console.log('✅ Generated favicon-32x32.png');

  // Generate favicon 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(__dirname, 'public', 'favicon-16x16.png'));

  console.log('✅ Generated favicon-16x16.png');
}

generateIcons().catch(console.error);
