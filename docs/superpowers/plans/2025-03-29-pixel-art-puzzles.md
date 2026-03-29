# Pixel Art Puzzles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a build script that converts 10 images to pixel art puzzles with max 16 colors, replacing the default Simple Heart puzzle.

**Architecture:** A Node.js script using the `sharp` library for image processing and a custom k-means implementation for color quantization. The script reads images from `/images/`, processes them 32x32, and outputs a JSON file with puzzle data.

**Tech Stack:** Node.js, sharp (image processing), k-means clustering algorithm

---

## File Structure

**Files to create:**
- `scripts/build-puzzles.js` - Main build script that orchestrates conversion
- `scripts/utils/kMeans.js` - K-means clustering for color quantization
- `scripts/utils/imageProcessor.js` - Image reading and pixel extraction

**Files to modify:**
- `data/defaultPuzzles.json` - Will be overwritten with new puzzles
- `package.json` - Add dependency and npm script

---

### Task 1: Install sharp dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install sharp package**

Run: `npm install sharp`
Expected: Installation completes with sharp added to dependencies

- [ ] **Step 2: Verify package.json was updated**

Run: `cat package.json | grep sharp`
Expected: Output shows `"sharp": "^"` in dependencies

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add sharp dependency for image processing"
```

---

### Task 2: Create k-means utility module

**Files:**
- Create: `scripts/utils/kMeans.js`
- Test: Verify function works with simple input

- [ ] **Step 1: Create the k-means implementation**

```javascript
/**
 * K-means clustering for color quantization
 * @param {Array<{r: number, g: number, b: number}>} pixels - Array of rgb objects
 * @param {number} k - Number of clusters (max colors)
 * @returns {Array<{r: number, g: number, b: number}>} Array of centroids
 */
function kMeans(pixels, k) {
  if (pixels.length === 0) {
    return [{ r: 128, g: 128, b: 128 }];
  }

  if (pixels.length <= k) {
    return pixels;
  }

  // Initialize centroids randomly from pixels
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({ r: randomPixel.r, g: randomPixel.g, b: randomPixel.b });
  }

  // Iterate until convergence or max iterations
  for (let iteration = 0; iteration < 20; iteration++) {
    // Assign pixels to nearest centroid
    const clusters = Array(k).fill(null).map(() => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCentroid = 0;

      for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        const dist = Math.sqrt(
          Math.pow(pixel.r - centroid.r, 2) +
          Math.pow(pixel.g - centroid.g, 2) +
          Math.pow(pixel.b - centroid.b, 2)
        );

        if (dist < minDist) {
          minDist = dist;
          closestCentroid = i;
        }
      }

      clusters[closestCentroid].push(pixel);
    }

    // Update centroids
    let changed = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) continue;

      const newCentroid = {
        r: Math.round(cluster.reduce((sum, p) => sum + p.r, 0) / cluster.length),
        g: Math.round(cluster.reduce((sum, p) => sum + p.g, 0) / cluster.length),
        b: Math.round(cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length)
      };

      if (newCentroid.r !== centroids[i].r ||
          newCentroid.g !== centroids[i].g ||
          newCentroid.b !== centroids[i].b) {
        changed = true;
        centroids[i] = newCentroid;
      }
    }

    if (!changed) break;
  }

  return centroids;
}

/**
 * Calculate distance between two colors
 * @param {{r: number, g: number, b: number}} c1
 * @param {{r: number, g: number, b: number}} c2
 * @returns {number} Euclidean distance
 */
function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Find the index of the closest color in palette
 * @param {{r: number, g: number, b: number}} pixel
 * @param {Array<{r: number, g: number, b: number}>} palette
 * @returns {number} Index in palette (0-based)
 */
function findClosestColor(pixel, palette) {
  let minDist = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistance(pixel, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Convert RGB object to hex string
 * @param {{r: number, g: number, b: number}} color
 * @returns {string} Hex color string
 */
function rgbToHex(color) {
  return '#' + [color.r, color.g, color.b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

module.exports = {
  kMeans,
  colorDistance,
  findClosestColor,
  rgbToHex
};
```

- [ ] **Step 2: Create and run a quick test**

Create a test file `test-kmeans.js`:
```javascript
const { kMeans, findClosestColor, rgbToHex } = require('./scripts/utils/kMeans.js');

// Test with sample pixels
const pixels = [
  {r: 255, g: 0, b: 0}, {r: 255, g: 10, b: 0},
  {r: 0, g: 255, b: 0}, {r: 0, g: 250, b: 10},
  {r: 0, g: 0, b: 255}, {r: 10, g: 0, b: 255}
];

const result = kMeans(pixels, 3);
console.log('K-means result:', result);

const palette = result.map(rgbToHex);
console.log('Palette:', palette);

const testColor = {r: 255, g: 5, b: 0};
const closestIdx = findClosestColor(testColor, result);
console.log('Closest to red:', closestIdx, palette[closestIdx]);
```

Run: `node test-kmeans.js`
Expected: Output shows 3 distinct colors and correctly identifies red as closest to test color

- [ ] **Step 3: Remove test file**

Run: `rm test-kmeans.js`

- [ ] **Step 4: Commit**

```bash
git add scripts/utils/kMeans.js
git commit -m "feat: add k-means clustering utility for color quantization"
```

---

### Task 3: Create image processor utility

**Files:**
- Create: `scripts/utils/imageProcessor.js`

- [ ] **Step 1: Create image processor module**

```javascript
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
```

- [ ] **Step 2: Test image processor with one image**

Create test file `test-processor.js`:
```javascript
const { processImage, formatDisplayName, generatePuzzleId } = require('./scripts/utils/imageProcessor.js');

async function test() {
  try {
    const result = await processImage('./images/cat.png');
    console.log('Total pixels:', result.pixels.length);
    console.log('Opaque pixels:', result.opaquePixels.length);
    console.log('Sample pixel:', result.pixels[0]);
    console.log('Display name:', formatDisplayName('cat.png'));
    console.log('Puzzle ID:', generatePuzzleId('cat.png'));
    console.log('Pokemon test:', formatDisplayName('pokemon1.jpeg'));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
```

Run: `node test-processor.js`
Expected: Output shows 1024 pixels (32x32), opaque count, sample pixel data, and correctly formatted names

- [ ] **Step 3: Remove test file**

Run: `rm test-processor.js`

- [ ] **Step 4: Commit**

```bash
git add scripts/utils/imageProcessor.js
git commit -m "feat: add image processor utility for extracting pixel data"
```

---

### Task 4: Create main build script

**Files:**
- Create: `scripts/build-puzzles.js`

- [ ] **Step 1: Create main build script**

```javascript
const fs = require('fs');
const path = require('path');
const { processImage, formatDisplayName, generatePuzzleId, TARGET_SIZE, MAX_COLORS } = require('./utils/imageProcessor.js');
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

      if (pixel.a < 128) {
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
    palette: palette.slice(0, Math.max(3, palette.length)),
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
      if (!Number.isInteger(val) || val < 0 || val > MAX_COLORS) {
        throw new Error(`Invalid value at [${i}][${j}]: ${val} (must be 0-${MAX_COLORS})`);
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json` to add the build script:

Find the "scripts" section and add:
```json
"build:puzzles": "node scripts/build-puzzles.js"
```

Run: `npm run build:puzzles`
Expected: Script processes all 10 images and creates data/defaultPuzzles.json

- [ ] **Step 3: Verify output**

Run: `cat data/defaultPuzzles.json | head -50`
Expected: Valid JSON with first puzzle structure containing id, name, targetGrid (32x32), palette, etc.

Run: `cat data/defaultPuzzles.json | jq '. | length'` (or count manually if jq not available)
Expected: 10

- [ ] **Step 4: Commit**

```bash
git add scripts/build-puzzles.js package.json data/defaultPuzzles.json
git commit -m "feat: add build script to convert images to pixel puzzles"
```

---

### Task 5: Verify game integration

**Files:**
- No changes needed, just testing

- [ ] **Step 1: Launch the game to verify puzzles appear**

Run: `npx serve .` (or open index.html directly)
Expected: Home screen displays the 10 new puzzles instead of "Simple Heart"

- [ ] **Step 2: Click on a puzzle to verify it loads**

Click on one of the puzzle cards
Expected: Editor opens with the correct grid and palette visible

- [ ] **Step 3: Run existing tests**

Run: `npm test` (if test command exists)
Expected: All existing tests pass (if any)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete pixel art puzzles integration with 10 new images"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✓ Convert 10 images to puzzles
- ✓ Max 16 colors (k-means)
- ✓ 32x32 grid
- ✓ Replace defaultPuzzles.json
- ✓ Remove Simple Heart
- ✓ Script in build:puzzles

**Placeholder scan - NO PLACEHOLDERS FOUND**

**Type consistency - VERIFIED:**
- `kMeans` always takes `pixels` (array of {r,g,b}) and `k` (number)
- `processImage` always returns `{pixels, opaquePixels}`
- Puzzle structure consistent across all tasks
- Color palette always mapped with indices 0-16

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2025-03-29-pixel-art-puzzles.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
