# Migration Guide: Variable and Rectangular Puzzle Dimensions

## Overview

This update enables puzzles to have variable and rectangular dimensions (e.g., 16x16, 16x24, 24x32, 32x48) where width and height can differ.

## Backward Compatibility

✅ **100% backward compatible** - All existing 32x32 puzzles continue to work without modification.

## Architecture

### Dynamic Detection
Dimensions are automatically detected from puzzle data:
- `gridHeight = puzzle.targetGrid.length`
- `gridWidth = puzzle.targetGrid[0].length`

### Modified Components
- **CanvasEngine** - Accepts optional `width` and `height` parameters (default: 32, 32)
- **ImageConverter** - Accepts optional `width` and `height` parameters (default: 32, 32)
- **EditorView** - Uses dynamic dimensions from puzzle
- **PuzzleCard** - Uses dynamic dimensions from puzzle
- **ImportModal** - Allows separate width and height selection during import

## Available Grid Sizes

When importing, you can choose from:
- 8×8 (Very small)
- 12×12 (Small)
- 16×16
- 20×20
- 24×24
- **32×32** (Standard - Default)
- 40×40
- 48×48
- 64×64

And all possible rectangular combinations (e.g., 16×32, 24×48, etc.)

## For Developers

### Create Puzzle with Custom Dimensions

```javascript
// Rectangular 16x24
const converter = new ImageConverter(16, 24);
const puzzle = await converter.convertImage(file, 'My Rectangular Puzzle');

// Square 24x24
const converter = new ImageConverter(24, 24);
const puzzle = await converter.convertImage(file, 'My Square Puzzle');
```

### CanvasEngine with Dimensions

```javascript
const gridHeight = puzzle.targetGrid.length;
const gridWidth = puzzle.targetGrid[0].length;
const engine = new CanvasEngine(canvas, gridWidth, gridHeight);
```

## Aspect Ratio Handling

When converting images, ImageConverter automatically preserves the aspect ratio of the source image and centers it in the target grid. Pixels remain square.

## Tests

- All existing tests pass
- New tests for variable dimensions in `tests/variable-dimensions.spec.ts`
- Tests for rectangular grids (16x24, 24x48, etc.)

## Implementation Status

✅ Task 1: CanvasEngine with dynamic width/height
✅ Task 2: ImageConverter with dynamic width/height
✅ Task 3: EditorView with dynamic dimensions
✅ Task 4: PuzzleCard with dynamic dimensions
✅ Task 5: ImportModal with width/height selectors
✅ Task 6: Export for testing
✅ Task 7: Tests passing
✅ Task 8: Documentation

All tasks completed successfully!
