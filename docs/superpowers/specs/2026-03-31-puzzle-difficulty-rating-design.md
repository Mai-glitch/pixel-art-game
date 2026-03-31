# Puzzle Difficulty Rating Design

## Goal

Add a 5-star difficulty rating to each puzzle on the home screen, calculated dynamically from the number of colors and pixels.

## Architecture

A pure utility function calculates difficulty based on two factors:
- **Colors**: Number of distinct colors in the palette (normalized to 0-5 range)
- **Pixels**: Total number of pixels in the grid (width × height, normalized to 0-5 range)

The formula combines these factors equally: `(colors/10 + pixels/1000) / 2 * 5`, clamped to 1-5 stars.

Stars are displayed in `PuzzleCard` below the puzzle name, using filled/empty star characters (★/☆) for immediate visual recognition.

## Tech Stack

- Vanilla JavaScript (no dependencies)
- Location: `core/PuzzleDifficulty.js`
- Integration: `components/PuzzleCard.js`
- Testing: Vitest/Jest (follow existing patterns)

## Components

### 1. Difficulty Calculator (`core/PuzzleDifficulty.js`)

Exports a single function:
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

### 2. Difficulty Display (`components/PuzzleCard.js`)

Add to `render()` method:
- Create difficulty container element
- Call `calculateDifficulty()` with puzzle data
- Render star characters: `★` for filled, `☆` for empty
- Style: 14px, yellow/orange color (#FFD700), right-aligned
- Position: Below puzzle name, above progress bar

Markup:
```javascript
const difficulty = document.createElement('div');
difficulty.style.cssText = `
  font-size: 14px;
  color: #FFD700;
  letter-spacing: 2px;
`;
difficulty.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
```

### 3. Error Handling

- Grid or palette missing: return 1 (easiest)
- Empty array: treat as minimum difficulty
- Invalid dimensions: use sensible defaults

## Testing

Test cases:
- 32x32 with 5 colors (basketball) → 3 stars
- 16x16 with 4 colors (256 pixels) → 2 stars
- 64x64 with 12 colors (4096 pixels) → 5 stars
- Empty inputs → 1 star (minimum)
- Missing parameters → 1 star (graceful degradation)

## Files

- **Create**: `core/PuzzleDifficulty.js` (difficulty calculation)
- **Create**: `tests/core/PuzzleDifficulty.test.js` (unit tests)
- **Modify**: `components/PuzzleCard.js` (add difficulty display)
- **Style**: Inline CSS in PuzzleCard (follow existing pattern)

## Dependencies

None. Pure JavaScript implementation.
