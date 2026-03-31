const fs = require('fs');
const path = require('path');
const { processImage, formatDisplayName, generatePuzzleId, TARGET_SIZE, MAX_COLORS, OPACITY_THRESHOLD } = require('./utils/imageProcessor.js');
const { kMeans, findClosestColor, rgbToHex, mergeSimilarColors } = require('./utils/kMeans.js');

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
  const kMeansResult = kMeans(opaquePixels, MAX_COLORS);
  
  // Merge similar colors to create more distinct palette
  const mergedColors = mergeSimilarColors(kMeansResult, 35); // Threshold of 35 for aggressive merging
  
  // Use merged colors directly since mergeSimilarColors already reduces the palette
  const finalColors = mergedColors;
  
  const palette = finalColors.map(rgbToHex);

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
          finalColors
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
 * @param {Object} options - Build options
 * @param {string} options.sourceDir - Source directory for images (default: IMAGES_DIR)
 * @param {boolean} options.mergeWithExisting - Whether to merge with existing puzzles
 * @param {Array} options.existingPuzzles - Existing puzzles to merge with
 * @param {string} options.outputFile - Output file path (default: OUTPUT_FILE)
 * @returns {Promise<Array>} Array of generated puzzles
 */
async function buildPuzzles(options = {}) {
  const {
    sourceDir = IMAGES_DIR,
    mergeWithExisting = false,
    existingPuzzles = null,
    outputFile = OUTPUT_FILE
  } = options;

  try {
    console.log('Building puzzles...\n');

    // Load existing puzzles if in merge mode
    let existingPuzzleMap = new Map();
    if (mergeWithExisting && existingPuzzles) {
      existingPuzzles.forEach(p => existingPuzzleMap.set(p.id, p));
      console.log(`Loaded ${existingPuzzles.length} existing puzzles for merging`);
    }

    // Read images directory
    const files = fs.readdirSync(sourceDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VALID_EXTENSIONS.includes(ext);
    });

    console.log(`Found ${imageFiles.length} images to process in ${sourceDir}`);

    // Convert each image
    const newPuzzles = [];
    for (const filename of imageFiles) {
      const imagePath = path.join(sourceDir, filename);
      try {
        const puzzle = await convertImageToPuzzle(imagePath);

        // Check if puzzle already exists
        if (existingPuzzleMap.has(puzzle.id)) {
          console.log(`  ⊘ ${filename} -> ${puzzle.name} (already exists, skipping)`);
          continue;
        }

        validatePuzzle(puzzle);
        newPuzzles.push(puzzle);
        console.log(`  ✓ ${filename} -> ${puzzle.name} (${puzzle.palette.length} colors)`);
      } catch (err) {
        console.error(`  ✗ ${filename}: ${err.message}`);
      }
    }

    // Prepare final puzzle list
    let finalPuzzles;
    if (mergeWithExisting) {
      finalPuzzles = [...existingPuzzles, ...newPuzzles];
      console.log(`\nSuccessfully processed ${newPuzzles.length}/${imageFiles.length} new images`);
      console.log(`Total puzzles after merge: ${finalPuzzles.length}`);
    } else {
      finalPuzzles = newPuzzles;
      console.log(`\nSuccessfully processed ${newPuzzles.length}/${imageFiles.length} images`);
    }

    // Sort puzzles alphabetically by name
    finalPuzzles.sort((a, b) => a.name.localeCompare(b.name));

    // Write output
    fs.writeFileSync(outputFile, JSON.stringify(finalPuzzles, null, 2));
    console.log(`\n✓ Output written to: ${outputFile}`);

    // Summary
    console.log('\nPuzzles generated:');
    finalPuzzles.forEach((p, i) => {
      const isNew = newPuzzles.some(np => np.id === p.id);
      console.log(`  ${i + 1}. ${p.name} (${p.palette.length} colors)${isNew ? ' [NEW]' : ''}`);
    });

    return finalPuzzles;

  } catch (err) {
    console.error('\n✗ Build failed:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const mergeMode = args.includes('--merge');
  const sourceIndex = args.indexOf('--source');
  const sourceDir = sourceIndex >= 0 ? args[sourceIndex + 1] : null;

  let existingPuzzles = null;
  if (mergeMode && fs.existsSync(OUTPUT_FILE)) {
    existingPuzzles = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  }

  const options = {
    mergeWithExisting: mergeMode,
    existingPuzzles,
    ...(sourceDir && { sourceDir })
  };

  buildPuzzles(options);
}

module.exports = { buildPuzzles, convertImageToPuzzle };
