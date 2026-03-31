const fs = require('fs');
const path = require('path');
const { buildPuzzles } = require('./build-puzzles.js');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const NEW_IMAGES_DIR = path.join(IMAGES_DIR, '2');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'defaultPuzzles.json');

/**
 * Add new puzzles from /images/2/ directory
 * Usage: node scripts/add-new-puzzles.js
 */
async function addNewPuzzles() {
  console.log('======================================');
  console.log('  Adding New Puzzles from /images/2/');
  console.log('======================================\n');

  // Check if /images/2/ exists and has images
  if (!fs.existsSync(NEW_IMAGES_DIR)) {
    console.error('✗ Error: /images/2/ directory does not exist');
    console.log('  Create the directory and add new images to continue');
    process.exit(1);
  }

  const files = fs.readdirSync(NEW_IMAGES_DIR);
  const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return VALID_EXTENSIONS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log('⚠ No images found in /images/2/');
    console.log('  Add images to this directory and run again');
    process.exit(0);
  }

  console.log(`Found ${imageFiles.length} new images:`);
  imageFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Load existing puzzles
  let existingPuzzles = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existingPuzzles = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log(`Current puzzle count: ${existingPuzzles.length}`);
  }

  // Build with merge mode
  const options = {
    sourceDir: NEW_IMAGES_DIR,
    mergeWithExisting: true,
    existingPuzzles: existingPuzzles,
    outputFile: OUTPUT_FILE
  };

  try {
    await buildPuzzles(options);
    console.log('\n======================================');
    console.log('  ✅ New puzzles added successfully!');
    console.log('======================================');
    console.log('\nNext steps:');
    console.log('  1. Clear /images/2/ to prepare for next batch');
    console.log('  2. Test the app - new puzzles should appear');
    console.log('  3. Existing users will see new puzzles on next app load');
  } catch (err) {
    console.error('\n✗ Failed to add new puzzles:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addNewPuzzles();
}

module.exports = { addNewPuzzles };
