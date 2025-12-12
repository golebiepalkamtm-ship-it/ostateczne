// Simple image sharpening script using sharp
// Usage: node scripts/sharpen-image.js

const fs = require('fs')
const path = require('path')

const inputPath = path.join(__dirname, '..', 'public', 'pigeon-lofts-background.jpg')
const outputPath = path.join(__dirname, '..', 'public', 'pigeon-lofts-background-sharp.jpg')

async function run() {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath)
    process.exit(2)
  }

  try {
    // Lazy-require sharp to keep npm install optional until needed
    const sharp = require('sharp')

    await sharp(inputPath)
      .resize({ width: 2400 }) // ensure reasonable size for sharpening
      .sharpen(1.2)
      .modulate({ brightness: 1, saturation: 1.02 })
      .jpeg({ quality: 90 })
      .toFile(outputPath)

    console.log('Wrote sharpened image to', outputPath)
  } catch (err) {
    console.error('Error processing image:', err)
    process.exit(1)
  }
}

run()
