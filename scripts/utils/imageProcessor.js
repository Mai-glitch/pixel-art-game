const sharp = require('sharp');
const path = require('path');

const TARGET_SIZE = 32;
const MAX_COLORS = 16;
const TRANSPARENCY_THRESHOLD = 128;

/**
 * Process an image file and extract pixel data
 * @param {string} imagePath - Path to image file
 * @returns {Promise<{
 *   pixels: Array<{r: number, g: number, b: number, a: number}>,
 *   opaquePixels: Array<{r: number, g: number, b: number}>
 * }>}
 */
async function processImage(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'cover',
      position: 'center'
    })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  const opaquePixels = [];

  for (let i = 0; i < data.length; i += 4) {
    const pixel = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3]
    };

    pixels.push(pixel);

    if (pixel.a >= TRANSPARENCY_THRESHOLD) {
      opaquePixels.push({ r: pixel.r, g: pixel.g, b: pixel.b });
    }
  }

  return { pixels, opaquePixels };
}

/**
 * Format filename to display name
 * @param {string} filename - Original filename (e.g., "basketball.png")
 * @returns {string} Formatted name (e.g., "Basketball")
 */
function formatDisplayName(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\d+$/, '') // Remove trailing numbers
    .replace(/\d+/g, ' $&') // Add space before numbers (pokemon1 -> pokemon 1)
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
}

/**
 * Generate puzzle ID from filename
 * @param {string} filename - Original filename
 * @returns {string} Puzzle ID (e.g., "default-basketball")
 */
function generatePuzzleId(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  return `default-${nameWithoutExt.toLowerCase()}`;
}

module.exports = {
  processImage,
  formatDisplayName,
  generatePuzzleId,
  TARGET_SIZE,
  MAX_COLORS,
  TRANSPARENCY_THRESHOLD
};
