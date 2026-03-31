# Add New Puzzles Without Breaking Existing User Progress

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add new puzzles from `/images/2/` directory while preserving existing user progress on current puzzles

**Architecture:** 
1. Modify `build-puzzles.js` to support incremental puzzle generation from subdirectories
2. Update `PuzzleStorage.initDefaults()` to merge new puzzles without overwriting user data
3. Add `scripts/add-new-puzzles.js` helper script to safely add puzzles from `/images/2/`

**Tech Stack:** Node.js, vanilla JavaScript, localStorage, sharp (image processing)

---

## File Structure

**Modified Files:**
- `scripts/build-puzzles.js` - Add support for subdirectory processing and merge mode
- `core/PuzzleStorage.js` - Update `initDefaults()` to merge instead of replace

**New Files:**
- `scripts/add-new-puzzles.js` - CLI script to add puzzles from /images/2/ incrementally

---

## Task 1: Add Merge Mode to build-puzzles.js

**Files:**
- Modify: `scripts/build-puzzles.js:118-164`

- [ ] **Step 1: Add merge mode parameter to buildPuzzles function**

```javascript
async function buildPuzzles(options = {}) {
  const { 
    sourceDir = IMAGES_DIR, 
    mergeWithExisting = false,
    existingPuzzlesPath = null 
  } = options;
```

- [ ] **Step 2: Update buildPuzzles to handle merge mode**

Replace the buildPuzzles function content (lines 118-164) with:

```javascript
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
```

- [ ] **Step 3: Update CLI to support merge flag**

Update the CLI section (lines 167-169) to:

```javascript
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
```

- [ ] **Step 4: Test the modified build script**

Run: `node scripts/build-puzzles.js --help` (should show usage)
Run: `node scripts/build-puzzles.js --merge`
Expected: Should show "Loaded X existing puzzles for merging" and process no new images (since /images/2 is empty)

- [ ] **Step 5: Commit changes**

```bash
git add scripts/build-puzzles.js
git commit -m "feat: add merge mode to build-puzzles.js for incremental puzzle additions"
```

---

## Task 2: Update PuzzleStorage to Merge New Puzzles

**Files:**
- Modify: `core/PuzzleStorage.js:130-140`

- [ ] **Step 1: Rewrite initDefaults to merge new puzzles**

Replace the initDefaults method (lines 130-140) with:

```javascript
  async initDefaults() {
    try {
      const defaults = await this.getDefaultPuzzles();
      const existing = this.getAll();
      
      // Create map of existing puzzles by ID
      const existingMap = new Map();
      existing.forEach(p => existingMap.set(p.id, p));
      
      // Track what's added
      let added = 0;
      let skipped = 0;
      
      defaults.forEach(defaultPuzzle => {
        if (existingMap.has(defaultPuzzle.id)) {
          // Puzzle already exists - preserve user progress
          skipped++;
        } else {
          // New puzzle - add it with empty progress
          this.save(defaultPuzzle);
          added++;
        }
      });
      
      if (added > 0) {
        console.log(`Added ${added} new puzzles, preserved ${skipped} existing puzzles`);
      }
    } catch (error) {
      console.error('Error initializing default puzzles:', error);
    }
  }
```

- [ ] **Step 2: Test the merge logic**

Open browser console and run:
```javascript
const storage = new PuzzleStorage();
storage.initDefaults().then(() => {
  console.log('All puzzles:', storage.getAll().length);
});
```

Expected: Should see "Added 0 new puzzles, preserved X existing puzzles" on subsequent runs

- [ ] **Step 3: Commit changes**

```bash
git add core/PuzzleStorage.js
git commit -m "feat: update initDefaults to merge new puzzles while preserving user progress"
```

---

## Task 3: Create Helper Script for Adding New Puzzles

**Files:**
- Create: `scripts/add-new-puzzles.js`

- [ ] **Step 1: Create the helper script**

```javascript
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
```

- [ ] **Step 2: Test the script (will find no images)**

Run: `node scripts/add-new-puzzles.js`
Expected: Should show "⚠ No images found in /images/2/"

- [ ] **Step 3: Add a test image to verify workflow**

Run: `cp /Users/mickaelross/devX/test-supapowa/images/1/cat.png /Users/mickaelross/devX/test-supapowa/images/2/new-cat.png`
Run: `node scripts/add-new-puzzles.js`
Expected: Should show "Found 1 new images" and add "New-cat" to defaultPuzzles.json

- [ ] **Step 4: Clean up test image**

Run: `rm /Users/mickaelross/devX/test-supapowa/images/2/new-cat.png`

- [ ] **Step 5: Commit the helper script**

```bash
git add scripts/add-new-puzzles.js
git commit -m "feat: add helper script to incrementally add puzzles from /images/2/"
```

---

## Task 4: Update README with Instructions

**Files:**
- Modify: `README.md` (add new section)

- [ ] **Step 1: Add "Adding New Puzzles" section to README**

Add this section at the end of README.md:

```markdown
## Adding New Puzzles

To add new puzzles without breaking existing user progress:

1. **Add images to `/images/2/` directory**
   ```bash
   cp your-new-image.png images/2/
   ```

2. **Run the add-new-puzzles script**
   ```bash
   node scripts/add-new-puzzles.js
   ```
   This will:
   - Process images from `/images/2/`
   - Add new puzzles to `data/defaultPuzzles.json`
   - Preserve all existing puzzles
   - Skip any puzzles that already exist (by ID)

3. **Clear the staging directory** (optional, for next batch)
   ```bash
   rm images/2/*
   ```

4. **Test locally**
   - Open the app in browser
   - New puzzles should appear in the list
   - Existing user progress is preserved

5. **Deploy**
   - Commit the updated `data/defaultPuzzles.json`
   - Push to deploy
   - Existing users will automatically see new puzzles on next app load

**How it works:**
- Puzzles are identified by ID (e.g., `default-cat`)
- If a puzzle ID already exists in the user's localStorage, it's never overwritten
- New puzzles get empty `paintedGrid` so users start fresh
- `initDefaults()` runs on every app load, adding any missing puzzles
```

- [ ] **Step 2: Commit documentation**

```bash
git add README.md
git commit -m "docs: add instructions for adding new puzzles incrementally"
```

---

## Self-Review

**Spec Coverage:**
- ✅ Load new puzzles from `/images/2/` - Task 1 & 3 handle multiple source directories
- ✅ Don't break existing user progress - Task 2 ensures merge without overwrite  
- ✅ Load defaultPuzzles.json at startup - Task 2 runs `getDefaultPuzzles()` every time
- ✅ Add only non-existent puzzles - Task 2 uses Map.has() to check IDs

**Placeholder Scan:**
- ✅ No "TBD", "TODO", or "implement later"
- ✅ All code is explicit with exact implementation
- ✅ No vague instructions like "add error handling"

**Type Consistency:**
- ✅ `mergeWithExisting` boolean used consistently
- ✅ `puzzle.id` used as key throughout
- ✅ File paths use constants from existing code
- ✅ Function signatures match imports/exports

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-31-add-new-puzzles.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
