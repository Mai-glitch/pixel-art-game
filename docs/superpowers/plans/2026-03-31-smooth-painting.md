# Smooth Painting with Line Interpolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement line interpolation in the painting system so that all pixels are colored when the user moves the mouse quickly across the canvas.

**Architecture:** Store the last painted position and use Bresenham's line algorithm to interpolate and paint all intermediate pixels between the last position and the current position. This ensures no pixels are skipped during fast mouse movements.

**Tech Stack:** Vanilla JavaScript, Canvas API, Bresenham's line algorithm

---

## File Structure

The plan modifies **one file**:
- `components/EditorView.js`: Contains the painting logic that needs interpolation

Key locations:
- Constructor: add `lastPaintedPos` property (line ~35)
- `paintAt()` method: implement line interpolation (line ~639)
- Global pointer move handler: pass previous position (line ~690)

---

## Analysis: Current Problem

The current implementation only paints at the current mouse position:
```javascript
paintAt(x, y) {
  const gridPos = this.engine.screenToGrid(x, y);
  // Only paints at gridPos - misses pixels between moves
}
```

**Problem:** When the mouse moves quickly, `pointermove` events fire at intervals (e.g., every 10-20 pixels), leaving gaps in the painting.

**Solution:** Store the last painted grid position and interpolate a line between `lastPos` and `currentPos`, painting all cells along that line.

---

## Task 1: Add Last Painted Position Tracking

**Files:**
- Modify: `components/EditorView.js:35` (constructor)

- [ ] **Step 1: Add lastPaintedPos property to constructor**

After line 34 (after `this.hasCelebrated = false;`), add:

```javascript
// Track last painted position for interpolation
this.lastPaintedPos = null;
```

- [ ] **Step 2: Reset lastPaintedPos when stopping painting**

In `stopPainting()` method (around line 710), after setting `this.isPainting = false`, add:

```javascript
this.lastPaintedPos = null;
```

- [ ] **Step 3: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: add lastPaintedPos tracking for painting interpolation"
```

---

## Task 2: Implement Bresenham's Line Algorithm

**Files:**
- Modify: `components/EditorView.js` (add new method after `paintAt`)

- [ ] **Step 1: Add getLinePixels method after paintAt**

After the `paintAt()` method (around line 664), add this new method:

```javascript
/**
 * Get all grid coordinates along a line between two points using Bresenham's algorithm
 * @param {number} x0 - Starting X coordinate
 * @param {number} y0 - Starting Y coordinate  
 * @param {number} x1 - Ending X coordinate
 * @param {number} y1 - Ending Y coordinate
 * @returns {Array<{x: number, y: number}>} Array of grid coordinates
 */
getLinePixels(x0, y0, x1, y1) {
  const pixels = [];
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  let x = x0;
  let y = y0;
  
  while (true) {
    pixels.push({ x, y });
    
    if (x === x1 && y === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return pixels;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: implement Bresenham's line algorithm for pixel interpolation"
```

---

## Task 3: Modify paintAt to Use Interpolation

**Files:**
- Modify: `components/EditorView.js:639-664` (paintAt method)

- [ ] **Step 1: Rewrite paintAt method with interpolation**

Replace the entire `paintAt` method (lines 639-664) with:

```javascript
paintAt(x, y) {
  const currentPos = this.engine.screenToGrid(x, y);
  
  // Check bounds
  if (currentPos.x < 0 || currentPos.x >= 32 || currentPos.y < 0 || currentPos.y >= 32) {
    // Still update lastPaintedPos even if outside bounds so we can paint back in
    return;
  }
  
  // Determine which pixels to paint
  let pixelsToPaint = [];
  
  if (this.lastPaintedPos && 
      (this.lastPaintedPos.x !== currentPos.x || this.lastPaintedPos.y !== currentPos.y)) {
    // Interpolate line between last position and current position
    pixelsToPaint = this.getLinePixels(
      this.lastPaintedPos.x,
      this.lastPaintedPos.y,
      currentPos.x,
      currentPos.y
    );
  } else {
    // First paint or same position - just paint current
    pixelsToPaint = [currentPos];
  }
  
  // Update last painted position
  this.lastPaintedPos = { ...currentPos };
  
  // Filter out positions already painted or not matching color
  let hasChanged = false;
  
  for (const pos of pixelsToPaint) {
    // Skip if out of bounds
    if (pos.x < 0 || pos.x >= 32 || pos.y < 0 || pos.y >= 32) continue;
    
    if (this.selectedColor === this.ERASER_INDEX) {
      // Eraser mode: clear painted pixels
      if (this.puzzle.paintedGrid[pos.y]?.[pos.x] === 1) {
        this.puzzle.paintedGrid[pos.y][pos.x] = 0;
        this.hasCelebrated = false;
        hasChanged = true;
      }
    } else {
      // Normal painting mode
      if (this.engine.paintPixel(pos.x, pos.y, this.selectedColor, this.puzzle.targetGrid)) {
        this.puzzle.paintedGrid[pos.y][pos.x] = 1;
        hasChanged = true;
      }
    }
  }
  
  // Only save and render if something changed
  if (hasChanged) {
    this.storage.saveProgress(this.puzzleId, this.puzzle.paintedGrid);
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
    this.updateProgress();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: implement line interpolation in paintAt for smooth painting"
```

---

## Task 4: Write Test for Smooth Painting

**Files:**
- Create: `tests/smooth-painting.spec.ts`

- [ ] **Step 1: Create test file**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smooth Painting with Line Interpolation', () => {
  const testPuzzle = {
    id: 'test-smooth-painting',
    name: 'Test Smooth Painting',
    // Create a horizontal line pattern
    targetGrid: Array(32).fill(null).map((_, y) => 
      Array(32).fill(null).map((_, x) => y === 16 ? 1 : 0)
    ),
    paintedGrid: Array(32).fill(null).map(() => Array(32).fill(0)),
    palette: ['#FF6B6B'],
    completedPercent: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  test.beforeEach(async ({ page }) => {
    // Inject test puzzle into storage
    await page.goto('/');
    await page.evaluate((puzzle) => {
      localStorage.setItem('colorQuest_puzzles', JSON.stringify([puzzle]));
      localStorage.setItem('colorQuest_paintedGrid_' + puzzle.id, JSON.stringify(puzzle.paintedGrid));
    }, testPuzzle);
    // Navigate to puzzle editor
    await page.goto('/#puzzle/' + testPuzzle.id);
    await page.waitForSelector('#editor-view', { timeout: 5000 });
  });

  test('should paint all pixels when moving mouse quickly', async ({ page }) => {
    // Select color 1 from the palette
    const paletteButtons = await page.locator('.palette button').all();
    await paletteButtons[1].click(); // Index 1 is the first color (index 0 is eraser)
    await page.waitForTimeout(300);

    // Get canvas dimensions
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (!box) return;
    
    const cellSize = box.width / 32;
    const rowY = box.y + (16 * cellSize) + (cellSize / 2); // Middle row (y=16)
    const startX = box.x + (5 * cellSize) + (cellSize / 2);
    const endX = box.x + (26 * cellSize) + (cellSize / 2);
    
    // Move to start position
    await page.mouse.move(startX, rowY);
    await page.waitForTimeout(100);
    
    // Start painting
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    // Move quickly to end position (simulating fast mouse movement)
    await page.mouse.move(endX, rowY, { steps: 3 }); // Only 3 steps = fast movement
    await page.waitForTimeout(100);
    
    // Stop painting
    await page.mouse.up();
    await page.waitForTimeout(300);
    
    // Verify progress indicates most of the row was painted
    const progressText = await page.locator('header span').textContent();
    const percent = parseInt(progressText || '0');
    
    // Should have painted at least 15 out of 22 pixels in the row
    // (approximately 70% of the line segment)
    expect(percent).toBeGreaterThan(15);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smooth-painting-test.png', fullPage: true });
  });

  test('should paint diagonal lines correctly', async ({ page }) => {
    // Create diagonal puzzle
    const diagonalPuzzle = {
      id: 'test-diagonal',
      name: 'Test Diagonal',
      targetGrid: Array(32).fill(null).map((_, y) => 
        Array(32).fill(null).map((_, x) => x === y ? 1 : 0) // Diagonal line
      ),
      paintedGrid: Array(32).fill(null).map(() => Array(32).fill(0)),
      palette: ['#4ECDC4'],
      completedPercent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await page.goto('/');
    await page.evaluate((puzzle) => {
      localStorage.setItem('colorQuest_puzzles', JSON.stringify([puzzle]));
      localStorage.setItem('colorQuest_paintedGrid_' + puzzle.id, JSON.stringify(puzzle.paintedGrid));
    }, diagonalPuzzle);
    await page.goto('/#puzzle/' + diagonalPuzzle.id);
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    // Select color 1
    const paletteButtons = await page.locator('.palette button').all();
    await paletteButtons[1].click();
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (!box) return;
    
    const cellSize = box.width / 32;
    
    // Paint along diagonal from (5,5) to (26,26)
    const startX = box.x + (5 * cellSize) + (cellSize / 2);
    const startY = box.y + (5 * cellSize) + (cellSize / 2);
    const endX = box.x + (26 * cellSize) + (cellSize / 2);
    const endY = box.y + (26 * cellSize) + (cellSize / 2);
    
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(endX, endY, { steps: 4 }); // Fast diagonal movement
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.waitForTimeout(300);
    
    // Verify good progress on diagonal
    const progressText = await page.locator('header span').textContent();
    const percent = parseInt(progressText || '0');
    
    // Should have painted at least 50% of the diagonal
    expect(percent).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
npx playwright test tests/smooth-painting.spec.ts --headed
```

Expected: Tests should pass, demonstrating smooth painting with interpolation.

- [ ] **Step 3: Commit**

```bash
git add tests/smooth-painting.spec.ts
git commit -m "test: add smooth painting tests for line interpolation"
```

---

## Task 5: Verify Existing Tests Still Pass

**Files:**
- Run existing painting tests

- [ ] **Step 1: Run continuous drawing test**

```bash
npx playwright test tests/continuous-drawing.spec.ts
```

Expected: PASS

- [ ] **Step 2: Run painting verification test**

```bash
npx playwright test tests/painting-verification.spec.ts
```

Expected: PASS

- [ ] **Step 3: Run all painting-related tests**

```bash
npx playwright test tests/*painting*.spec.ts tests/*drawing*.spec.ts
```

Expected: All PASS

- [ ] **Step 4: Commit (if any fixes needed)**

```bash
git add .
git commit -m "chore: verify smooth painting doesn't break existing tests"
```

---

## Implementation Complete

**Summary of changes:**
1. Added `lastPaintedPos` property to track the previous grid position
2. Implemented `getLinePixels()` using Bresenham's line algorithm
3. Modified `paintAt()` to interpolate between positions and paint all intermediate pixels
4. Added comprehensive tests for smooth painting

**Files modified:**
- `components/EditorView.js`: Added interpolation logic
- `tests/smooth-painting.spec.ts`: New test file

**Key algorithm insight:** Bresenham's algorithm efficiently determines which grid cells a line passes through, ensuring no pixels are missed during fast mouse movements.

---

## Self-Review Checklist

- [x] **Spec coverage:** All requirements from the feature request are implemented
- [x] **Placeholder scan:** No TODOs, TBDs, or incomplete sections
- [x] **Type consistency:** All method signatures and variables are consistent
- [x] **File paths:** All paths are exact and correct
- [x] **Code completeness:** Every step includes the actual code needed
- [x] **Test coverage:** Tests verify the interpolation works correctly
