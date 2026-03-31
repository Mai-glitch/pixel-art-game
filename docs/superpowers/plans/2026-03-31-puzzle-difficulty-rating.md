# Puzzle Difficulty Rating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5-star difficulty rating displayed on puzzle cards, calculated from colors and pixels using the formula: `(colors/10 + pixels/1000) / 2 * 5`

**Architecture:** A pure utility function in `core/PuzzleDifficulty.js` calculates difficulty from grid dimensions and palette size. PuzzleCard calls this during render to display filled/empty star characters.

**Tech Stack:** Vanilla JavaScript, no dependencies. Follow existing test patterns.

---

## File Structure

- **Create:** `core/PuzzleDifficulty.js` - difficulty calculation logic
- **Create:** `tests/core/PuzzleDifficulty.test.js` - unit tests
- **Modify:** `components/PuzzleCard.js` - add difficulty display

---

### Task 1: Create Difficulty Calculator

**Files:**
- Create: `core/PuzzleDifficulty.js`
- Test: `tests/core/PuzzleDifficulty.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/core/PuzzleDifficulty.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { calculateDifficulty } from '../../core/PuzzleDifficulty.js';

describe('calculateDifficulty', () => {
  it('should return 3 for 32x32 grid with 5 colors (basketball)', () => {
    const grid = Array(32).fill(null).map(() => Array(32).fill(0));
    const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255]];
    expect(calculateDifficulty(grid, palette)).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Command: `npm test -- tests/core/PuzzleDifficulty.test.js`
Expected: FAIL - "calculateDifficulty is not defined"

- [ ] **Step 3: Create the module with minimal implementation**

Create `core/PuzzleDifficulty.js`:
```javascript
/**
 * Calculate difficulty rating from 1 to 5 stars
 * @param {number[][]} targetGrid - 2D array of color indices
 * @param {number[][]} palette - Array of RGB color values
 * @returns {number} Difficulty rating (1-5)
 */
export function calculateDifficulty(targetGrid, palette) {
  const colors = palette?.length || 1;
  const pixels = (targetGrid?.length || 1) * (targetGrid?.[0]?.length || 1);
  
  const colorScore = Math.min(colors / 10, 1);
  const pixelScore = Math.min(pixels / 1000, 1);
  
  const rawDifficulty = ((colorScore + pixelScore) / 2) * 5;
  
  return Math.max(1, Math.min(5, Math.round(rawDifficulty)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Command: `npm test -- tests/core/PuzzleDifficulty.test.js`
Expected: PASS - (32x32 with 5 colors → 3 stars)

- [ ] **Step 5: Commit**

```bash
git add core/PuzzleDifficulty.js tests/core/PuzzleDifficulty.test.js
git commit -m "feat: add difficulty calculation for puzzles"
```

---

### Task 2: Add Edge Case Tests

**Files:**
- Modify: `tests/core/PuzzleDifficulty.test.js`

- [ ] **Step 1: Write tests for edge cases**

Add to `tests/core/PuzzleDifficulty.test.js`:
```javascript
  it('should return 2 for 16x16 grid with 4 colors', () => {
    const grid = Array(16).fill(null).map(() => Array(16).fill(0));
    const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]];
    expect(calculateDifficulty(grid, palette)).toBe(2);
  });

  it('should return 5 for 64x64 grid with 12 colors', () => {
    const grid = Array(64).fill(null).map(() => Array(64).fill(0));
    const palette = Array(12).fill(null).map((_, i) => [i * 20, i * 20, i * 20]);
    expect(calculateDifficulty(grid, palette)).toBe(5);
  });

  it('should return 1 for missing grid', () => {
    expect(calculateDifficulty(null, [[255, 0, 0]])).toBe(1);
  });

  it('should return 1 for missing palette', () => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(0));
    expect(calculateDifficulty(grid, null)).toBe(1);
  });

  it('should return 1 for empty palette', () => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(0));
    expect(calculateDifficulty(grid, [])).toBe(1);
  });
```

- [ ] **Step 2: Run tests**

Command: `npm test -- tests/core/PuzzleDifficulty.test.js`
Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/core/PuzzleDifficulty.test.js
git commit -m "test: add edge case tests for difficulty calculation"
```

---

### Task 3: Integrate Difficulty into PuzzleCard

**Files:**
- Modify: `components/PuzzleCard.js`
- Import: `core/PuzzleDifficulty.js`

- [ ] **Step 1: Import difficulty calculator**

Add at top of `components/PuzzleCard.js`:
```javascript
import { CanvasEngine } from '../core/CanvasEngine.js';
import { calculateDifficulty } from '../core/PuzzleDifficulty.js';
```

- [ ] **Step 2: Add difficulty calculation in render**

Add after creating `info` div (around line 50):
```javascript
const info = document.createElement('div');
info.style.cssText = `
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

// Calculate difficulty
const difficultyRating = calculateDifficulty(this.puzzle.targetGrid, this.puzzle.palette);
```

- [ ] **Step 3: Add difficulty display element**

Add after `name` element (around line 61-65):
```javascript
const name = document.createElement('h3');
name.textContent = this.puzzle.name;
name.style.cssText = `
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

// Add difficulty stars
const difficulty = document.createElement('div');
difficulty.style.cssText = `
  font-size: 14px;
  color: #FFD700;
  letter-spacing: 2px;
  margin-top: 2px;
`;
difficulty.textContent = '★'.repeat(difficultyRating) + '☆'.repeat(5 - difficultyRating);
```

- [ ] **Step 4: Append difficulty to info**

Update info appending (around line 95):
```javascript
info.appendChild(name);
info.appendChild(difficulty);
info.appendChild(progress);
```

- [ ] **Step 5: Test in browser**

Open the app and verify:
- Basketball puzzle (32x32, 5 colors) shows ★★★☆☆
- Other puzzles show appropriate star ratings

- [ ] **Step 6: Commit**

```bash
git add components/PuzzleCard.js
git commit -m "feat: display difficulty stars on puzzle cards"
```

---

## Verification

After completing all tasks:
1. Run full test suite: `npm test`
2. Open app and check puzzle cards display difficulty stars
3. Verify basketball puzzle shows 3 stars (★★★☆☆)

---

## Spec Coverage Check

✓ Difficulty calculator function implemented (Task 1)
✓ Formula: (colors/10 + pixels/1000) / 2 * 5 (Task 1)
✓ Edge case handling (Task 2)
✓ Star display in PuzzleCard (Task 3)
✓ Styling: 14px, yellow color (#FFD700) (Task 3)
✓ Tests for all scenarios (Tasks 1-2)

No gaps found.