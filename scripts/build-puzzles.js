const fs = require('fs');
const path = require('path');
const { processImage, formatDisplayName, generatePuzzleId, TARGET_SIZE, MAX_COLORS, OPACITY_THRESHOLD } = require('./utils/imageProcessor.js');
const { kMeans, findClosestColor, rgbToHex } = require('./utils/kMeans.js');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'defaultPuzzles.json');

const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

/**
 * Convert image to puzzle format
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Puzzle object
 */
async function convertImageToPuzzle(imagePath) {
  const filename = path.basename(imagePath);
  console.log(`Processing: ${filename}`);

  const { pixels, opaquePixels } = await processImage(imagePath);

  // Get palette using k-means (limit to MAX_COLORS)
  const colorPalette = kMeans(opaquePixels, MAX_COLORS);
  const palette = colorPalette.map(rgbToHex);

  // Ensure minimum 3 colors
  while (palette.length < 3) {
    palette.push('#808080');
  }

  // Create target grid (32x32) with color indices
  const targetGrid = [];
  for (let y = 0; y < TARGET_SIZE; y++) {
    const row = [];
    for (let x = 0; x < TARGET_SIZE; x++) {
      const pixelIndex = y * TARGET_SIZE + x;
      const pixel = pixels[pixelIndex];

      if (pixel.a < OPACITY_THRESHOLD) {
        row.push(0); // Transparent
      } else {
        const colorIndex = findClosestColor(
          { r: pixel.r, g: pixel.g, b: pixel.b },
          colorPalette
        );
        row.push(colorIndex + 1); // 1-based indexing for colors
      }
    }
    targetGrid.push(row);
  }

  // Create empty painted grid
  const paintedGrid = Array(TARGET_SIZE)
    .fill(null)
    .map(() => Array(TARGET_SIZE).fill(0));

  return {
    id: generatePuzzleId(filename),
    name: formatDisplayName(filename),
    targetGrid,
    paintedGrid,
    palette: palette,
    completedPercent: 0,
    lastPlayed: null
  };
}

/**
 * Validate puzzle structure
 * @param {Object} puzzle - Puzzle object to validate
 * @returns {boolean} True if valid
 */
function validatePuzzle(puzzle) {
  // Check grid dimensions
  if (!Array.isArray(puzzle.targetGrid) || puzzle.targetGrid.length !== TARGET_SIZE) {
    throw new Error(`Invalid grid rows: expected ${TARGET_SIZE}, got ${puzzle.targetGrid?.length}`);
  }

  for (let i = 0; i < puzzle.targetGrid.length; i++) {
    if (!Array.isArray(puzzle.targetGrid[i]) || puzzle.targetGrid[i].length !== TARGET_SIZE) {
      throw new Error(`Invalid grid columns at row ${i}: expected ${TARGET_SIZE}, got ${puzzle.targetGrid[i]?.length}`);
    }

    for (let j = 0; j < puzzle.targetGrid[i].length; j++) {
      const val = puzzle.targetGrid[i][j];
      if (!Number.isInteger(val) || val < 0 || val > puzzle.palette.length) {
        throw new Error(`Invalid value at [${i}][${j}]: ${val} (must be 0-${puzzle.palette.length})`);
      }
    }
  }

  // Check palette
  if (!Array.isArray(puzzle.palette) || puzzle.palette.length < 3 || puzzle.palette.length > MAX_COLORS) {
    throw new Error(`Invalid palette size: expected 3-${MAX_COLORS}, got ${puzzle.palette?.length}`);
  }

  // Check required fields
  const requiredFields = ['id', 'name', 'targetGrid', 'paintedGrid', 'palette', 'completedPercent'];
  for (const field of requiredFields) {
    if (!(field in puzzle)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
}

/**
 * Build all puzzles from images directory
 */
async function buildPuzzles() {
  try {
    console.log('Building puzzles...\n');

    // Read images directory
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VALID_EXTENSIONS.includes(ext);
    });

    console.log(`Found ${imageFiles.length} images to process`);

    // Convert each image
    const puzzles = [];
    for (const filename of imageFiles) {
      const imagePath = path.join(IMAGES_DIR, filename);
      try {
        const puzzle = await convertImageToPuzzle(imagePath);
        validatePuzzle(puzzle);
        puzzles.push(puzzle);
        console.log(`  ✓ ${filename} -> ${puzzle.name} (${puzzle.palette.length} colors)`);
      } catch (err) {
        console.error(`  ✗ ${filename}: ${err.message}`);
      }
    }

    console.log(`\nSuccessfully processed ${puzzles.length}/${imageFiles.length} images`);

    // Sort puzzles alphabetically by name
    puzzles.sort((a, b) => a.name.localeCompare(b.name));

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(puzzles, null, 2));
    console.log(`\n✓ Output written to: ${OUTPUT_FILE}`);

    // Summary
    console.log('\nPuzzles generated:');
    puzzles.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.palette.length} colors)`);
    });

  } catch (err) {
    console.error('\n✗ Build failed:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildPuzzles();
}

module.exports = { buildPuzzles, convertImageToPuzzle };
