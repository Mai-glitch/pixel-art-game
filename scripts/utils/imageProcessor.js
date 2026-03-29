const sharp = require('sharp');
const path = require('path');

const TARGET_SIZE = 32;
const MAX_COLORS = 16;
const OPACITY_THRESHOLD = 128;

/**
 * Process an image file and extract pixel data
 * @param {string} imagePath - Path to image file
 * @returns {Promise<{
 *   pixels: Array<{r: number, g: number, b: number, a: number}>,
 *   opaquePixels: Array<{r: number, g: number, b: number}>
 * }>}
 */
async function processImage(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('Invalid image path: must be a non-empty string');
  }

  let data, info;
  try {
    const result = await sharp(imagePath)
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    info = result.info;
  } catch (error) {
    throw new Error(`Failed to process image "${imagePath}": ${error.message}`);
  }

  const expectedSize = TARGET_SIZE * TARGET_SIZE * 4;
  if (data.length !== expectedSize) {
    throw new Error(`Buffer size mismatch: expected ${expectedSize} bytes, got ${data.length} bytes`);
  }

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

    if (pixel.a >= OPACITY_THRESHOLD) {
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
  if (!filename || typeof filename !== 'string') {
    return '';
  }
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
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  return `default-${nameWithoutExt.toLowerCase()}`;
}

module.exports = {
  processImage,
  formatDisplayName,
  generatePuzzleId,
  TARGET_SIZE,
  MAX_COLORS,
  OPACITY_THRESHOLD
};
