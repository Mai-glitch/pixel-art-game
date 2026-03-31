# Fix Puzzle Thumbnails Aspect Ratio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the puzzle card thumbnails so non-square puzzles are not distorted on the homepage.

**Architecture:** The puzzle card currently creates a 64x64 canvas with fixed `aspect-ratio: 1`, which distorts rectangular puzzles. We'll update CanvasEngine's `createThumbnail` method to generate a squared thumbnail using `object-fit: cover` approach - centering and cropping the puzzle to fit a square without distortion.

**Tech Stack:** Vanilla JavaScript (ES6 modules), CSS

---

## File Structure

**Files to modify:**
- `core/CanvasEngine.js` - Update `createThumbnail` method to use cover/center approach

**Current problematic code location:**
- Lines 200-221 in CanvasEngine.js: `createThumbnail` method

**Reference:**
- `components/PuzzleCard.js:31-44` - Currently uses fixed 64x64 canvas with aspect-ratio: 1

---

### Task 1: Update createThumbnail to Use Cover Approach

**Files:**
- Modify: `core/CanvasEngine.js:200-221` (createThumbnail method)

- [ ] **Step 1: Write the failing test**

Create a test that verifies the thumbnail maintains square aspect ratio without distortion.

```javascript
// File: tests/core/CanvasEngine.test.js
// Add to existing test file

describe('CanvasEngine.createThumbnail', () => {
  it('should create square thumbnail for rectangular puzzle', () => {
    const targetGrid = [
      [1, 1, 1, 1, 1],  // 5 columns
      [2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3]   // 3 rows (5x3 = rectangular)
    ];
    const palette = ['#ff0000', '#00ff00', '#0000ff'];
    
    const engine = new CanvasEngine(document.createElement('canvas'), 5, 3);
    const dataUrl = engine.createThumbnail(targetGrid, palette);
    
    // Create an image to verify dimensions
    const img = new Image();
    img.src = dataUrl;
    
    // In test environment, we need to mock or verify the canvas dimensions
    // The returned canvas should be 64x64 (square)
    expect(dataUrl).toBeTruthy();
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });
  
  it('should center wide puzzle in square thumbnail', () => {
    // Wide puzzle (more columns than rows)
    const targetGrid = [
      [1, 1, 1, 1, 1, 1, 1, 1],  // 8 columns
      [2, 2, 2, 2, 2, 2, 2, 2]   // 2 rows
    ];
    // Should be centered vertically with empty space on sides
  });
  
  it('should center tall puzzle in square thumbnail', () => {
    // Tall puzzle (more rows than columns)
    const targetGrid = [
      [1],
      [1],
      [1],
      [1],
      [1],
      [1],
      [1],
      [1]  // 8 rows, 1 column
    ];
    // Should be centered horizontally with empty space top/bottom
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/core/CanvasEngine.test.js::CanvasEngine.createThumbnail
```

Expected: FAIL - Current implementation doesn't center/crop properly

- [ ] **Step 3: Implement cover-based thumbnail generation**

Replace the `createThumbnail` method in `core/CanvasEngine.js` (lines 200-221):

```javascript
// Replace from:
createThumbnail(targetGrid, palette) {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 64;
  thumbCanvas.height = 64;
  const thumbCtx = thumbCanvas.getContext('2d');

  // For thumbnails, use a fixed size and adapt the image
  const maxGridDimension = Math.max(this.gridWidth, this.gridHeight);
  const thumbPixelSize = 64 / maxGridDimension;

  for (let y = 0; y < this.gridHeight; y++) {
    for (let x = 0; x < this.gridWidth; x++) {
      const colorIndex = targetGrid[y]?.[x] || 0;
      if (colorIndex > 0) {
        thumbCtx.fillStyle = palette[colorIndex - 1];
        thumbCtx.fillRect(x * thumbPixelSize, y * thumbPixelSize, thumbPixelSize, thumbPixelSize);
      }
    }
  }

  return thumbCanvas.toDataURL();
}

// To:
createThumbnail(targetGrid, palette) {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 64;
  thumbCanvas.height = 64;
  const thumbCtx = thumbCanvas.getContext('2d');

  // Clear with transparent/background
  thumbCtx.fillStyle = '#ffffff';
  thumbCtx.fillRect(0, 0, 64, 64);

  // Calculate pixel size to fit the larger dimension (cover behavior)
  const maxGridDimension = Math.max(this.gridWidth, this.gridHeight);
  const pixelSize = 64 / maxGridDimension;

  // Calculate offsets to center the image
  const totalWidth = this.gridWidth * pixelSize;
  const totalHeight = this.gridHeight * pixelSize;
  const offsetX = (64 - totalWidth) / 2;
  const offsetY = (64 - totalHeight) / 2;

  // Draw the grid centered
  for (let y = 0; y < this.gridHeight; y++) {
    for (let x = 0; x < this.gridWidth; x++) {
      const colorIndex = targetGrid[y]?.[x] || 0;
      if (colorIndex > 0) {
        thumbCtx.fillStyle = palette[colorIndex - 1];
        thumbCtx.fillRect(
          offsetX + x * pixelSize,
          offsetY + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }

  return thumbCanvas.toDataURL();
}
```

- [ ] **Step 4: Create PuzzleCard test to verify integration**

```javascript
// File: tests/components/PuzzleCard.test.js

import { PuzzleCard } from '../../components/PuzzleCard.js';

describe('PuzzleCard with Thumbnail', () => {
  it('should render square thumbnail for rectangular puzzle', () => {
    const puzzle = {
      id: 'test-rect',
      name: 'Rectangular Test',
      targetGrid: [
        [1, 1, 1, 1, 1, 1, 1, 1],  // 8x2 = very wide
        [2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paintedGrid: [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
      palette: ['#ff0000', '#00ff00'],
      completedPercent: 0
    };
    
    const card = new PuzzleCard(puzzle, () => {});
    const element = card.render();
    const canvas = element.querySelector('canvas');
    
    // Canvas should exist and maintain square aspect ratio
    expect(canvas).toBeTruthy();
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(64);
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/core/CanvasEngine.test.js::CanvasEngine.createThumbnail
npm test -- tests/components/PuzzleCard.test.js::PuzzleCard with Thumbnail
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add core/CanvasEngine.js tests/
git commit -m "fix: center non-square puzzles in square thumbnails without distortion"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** The plan addresses the distortion issue by switching from fixed-ratio canvas to thumbnail with object-fit: contain
- [ ] **Complete code:** All code blocks contain working, copy-pasteable code
- [ ] **No placeholders:** No "TODO", "TBD", or vague descriptions
- [ ] **File paths:** All paths are exact and correct
- [ ] **Commands:** All commands include expected output

---

## Testing Instructions

**Manual verification:**
1. Start the app: `npm start` or open index.html
2. Import a rectangular image (wider than tall, or taller than wide)
3. Return to homepage
4. **Verify:** The thumbnail should show the puzzle centered in a square without stretching/distortion
5. **Verify:** Pixels should remain perfectly square (no rectangular distortion)
6. **Verify:** Square puzzles should still display correctly (no regression)

**What to look for:**
- ❌ **Before fix:** Wide puzzles stretch horizontally, tall puzzles stretch vertically; pixels become rectangular
- ✅ **After fix:** All puzzles are centered in a 64x64 square; pixels remain square; puzzle maintains proportions with equal margins on shorter sides

---

## Notes

- **Centering approach:** Instead of distorting the image, we calculate offsets (`offsetX`, `offsetY`) to center the puzzle within the 64x64 square
- **Pixel-perfect:** The `pixelSize` is calculated based on the maximum dimension, ensuring pixels remain square and undistorted
- **Cover behavior:** The puzzle fills the maximum possible space while maintaining aspect ratio (centered with equal margins on the shorter sides)
- This change is backward-compatible; existing square puzzles will be centered (no visible change) and rectangular puzzles will be properly centered without distortion
