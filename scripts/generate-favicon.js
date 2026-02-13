import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

async function generateFavicon() {
  const inputPath = path.join(publicDir, 'thalos-icon.png');
  
  // Create a 256x256 favicon with black background
  const blackBg = sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 }
    }
  }).png();

  // Resize the logo to fit within the favicon with padding
  const logo = await sharp(inputPath)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Composite logo on black background
  await sharp(await blackBg.toBuffer())
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // Also create ico-compatible version (32x32)
  await sharp(await blackBg.toBuffer())
    .composite([{ input: logo, gravity: 'center' }])
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));

  // Create apple-touch-icon (180x180)
  const appleBg = sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 }
    }
  }).png();

  const appleLogo = await sharp(inputPath)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(await appleBg.toBuffer())
    .composite([{ input: appleLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Favicon files generated successfully!');
}

generateFavicon().catch(console.error);
