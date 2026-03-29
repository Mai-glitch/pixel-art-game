# Design Document - Pixel Art Coloring Game

## Overview
A browser-based pixel art coloring puzzle game where players color 32x32 pixel images by numbers from a palette. Built with HTML5 Canvas and Vanilla JavaScript.

## Core Requirements
- **Game Mode:** Number-based coloring puzzle (paint-by-numbers)
- **Grid Size:** Fixed 32x32 pixels
- **Interface:** Two-screen navigation (Home list → Editor)
- **Canvas Interaction:** Zoom, pan with mouse and touch gestures
- **Responsive:** Full mobile support (all screens)
- **Storage:** LocalStorage for persistence
- **Tech Stack:** HTML5 Canvas + Vanilla JS, no external dependencies

## Architecture

### Directory Structure
```
/pixel-art-game
├── index.html              # Main entry point
├── styles.css              # Global styles
├── app.js                  # App coordination & router
├── components/
│   ├── HomeView.js        # Puzzle list screen
│   ├── EditorView.js      # Canvas + palette screen
│   ├── PuzzleCard.js      # Individual puzzle thumbnail
│   └── ImportModal.js     # File import dialog
├── core/
│   ├── CanvasEngine.js    # Drawing & interaction logic
│   ├── PuzzleStorage.js   # localStorage wrapper
│   └── ImageConverter.js  # Upload → puzzle conversion
└── data/
    └── defaultPuzzles.json # Pre-loaded puzzles
```

### View Management
Views are mounted/unmounted from DOM (not toggled with CSS):
- **HomeView:** Created on app load, destroyed when entering Editor
- **EditorView:** Created dynamically with puzzle ID, destroyed on return
- **ImportModal:** Created/destroyed as overlay

### Data Model

**Puzzle Object:**
```javascript
{
  id: "uuid",
  name: "Pikachu",
  targetGrid: [
    [1, 1, 2, 2, ...],  // 32 rows - expected color numbers (1-8)
    [...],
    ...
  ],
  paintedGrid: [
    [0, 0, 1, 1, ...],  // 32 rows - 0=not painted, 1=painted
    [...],
    ...
  ],
  palette: ["#FF0000", "#FFD700", "#000000"], // 3-8 colors
  completedPercent: 40,  // Auto-calculated from paintedGrid
  thumbnail: "data:image/png;base64,...",
  lastPlayed: "2026-03-29T14:30:00Z"  // ISO timestamp for "continue" sorting
}
```

**Storage Schema:**
- LocalStorage key: `pixelart_puzzles`
- JSON array of puzzle objects
- Auto-saved on every color change

## Components

### HomeView
**Purpose:** Display puzzle gallery with import capability

**Features:**
- Grid of PuzzleCard components
- "Import Image" button → opens ImportModal
- Progress indicators on cards
- Empty state illustration

**Navigation:**
- Click card → Route to `#editor/{puzzleId}`

### EditorView
**Purpose:** Main gameplay screen

**Features:**
- Canvas (512x512px, 16px per pixel)
- Color palette buttons (dynamic based on puzzle)
- Back button → Route to `#home`
- Progress indicator
- Completion celebration

**Canvas Display Logic:**
Uses `targetGrid` (expected colors) and `paintedGrid` (progress state):

1. Draw 32x32 grid background
2. For each cell at position (x, y):
   - Get targetColor = targetGrid[y][x] (1-8, 0=empty)
   - Get isPainted = paintedGrid[y][x] (0 or 1)
   
   - **If targetColor > 0 AND isPainted === 0:** 
     - Show desaturated preview of targetColor at 30% opacity
     - Show number (targetColor) centered in white bold
   
   - **If targetColor > 0 AND isPainted === 1:** 
     - Fill with full palette color (index targetColor - 1)
3. Grid lines: 1px light gray

**Desaturation Formula:**
```javascript
// Convert hex to grayscale preview
function desaturateColor(hex, opacity = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return `rgba(${gray}, ${gray}, ${gray}, ${opacity})`;
}
```

**Progress Calculation:**
```javascript
completedPercent = Math.round(
  (paintedPixelsCount / totalPixelsToPaint) * 100
);
```

**Interactivity:**
- **Zoom:** Mouse wheel (desktop) / Pinch gesture (mobile)
  - Min zoom: 1x (fit to screen)
  - Max zoom: 5x
  - Zoom centered on cursor position
- **Pan:** Mouse drag with right-click or middle-click (desktop) / Two-finger drag (mobile)
  - Pan constraints: cannot pan outside canvas bounds
- **Paint:** Left-click/tap → paint with selected color
- **Drag Paint:** Left-click drag → paint multiple pixels continuously
- **Validation:** Only correct color numbers can be painted (prevents mistakes)

### ImportModal
**Purpose:** Convert uploaded image to puzzle

**Flow:**
1. File input (image/*)
2. Preview thumbnail
3. Color reduction: Extract up to 8 most common colors
4. Generate 32x32 grid mapping
5. Save to LocalStorage
6. Route to editor

### PuzzleCard
**Purpose:** Visual thumbnail with metadata

**Display:**
- Mini canvas (64x64px) of puzzle
- Puzzle name
- Progress bar/percentage
- Hover: slight scale up effect

## Core Modules

### CanvasEngine
**Responsibilities:**
- Initialize 512x512 canvas
- Handle coordinate mapping (screen → grid)
- Render grid with current state
- Paint operations (single click, drag)
- Export thumbnail (64x64 canvas)

**Methods:**
- `render(grid, palette, canvas)` - Full redraw with current transform
- `paintPixel(x, y, colorIndex)` - Single pixel update
- `getGridFromXY(screenX, screenY)` - Hit testing with inverse transform
- `createThumbnail(grid, palette)` - Returns dataURL
- `zoom(delta, centerX, centerY)` - Zoom in/out at point
- `pan(deltaX, deltaY)` - Pan view
- `resetView()` - Reset zoom/pan to default
- `screenToGrid(screenX, screenY)` - Convert screen coords to grid coords

**Transform State:**
```javascript
{
  scale: 1.0,        // Current zoom level
  offsetX: 0,        // Pan X offset
  offsetY: 0,        // Pan Y offset
  minScale: 1.0,     // Fit to container
  maxScale: 5.0      // Maximum zoom
}
```

**Rendering with Transform:**
1. Clear canvas
2. Save context
3. Apply translate(offsetX, offsetY)
4. Apply scale(scale, scale)
5. Draw grid at base 512x512 size
6. Restore context

### PuzzleStorage
**Responsibilities:**
- Load/save puzzles to LocalStorage
- CRUD operations
- Data migrations (future-proofing)

**Methods:**
- `getAll()` → Array<Puzzle>
- `getById(id)` → Puzzle
- `save(puzzle)` → void (updates lastPlayed timestamp automatically)
- `saveProgress(id, paintedGrid)` → void (quick save without full puzzle object)
- `delete(id)` → void
- `getDefaultPuzzles()` → Array<Puzzle> (first run)
- `getRecentPuzzles(limit)` → Array<Puzzle> (sorted by lastPlayed desc)

**Paint Operation:**
When player paints pixel (x, y):
1. Validate: targetGrid[y][x] matches selected color
2. Update: paintedGrid[y][x] = 1
3. Save: `saveProgress(puzzleId, paintedGrid)` → LocalStorage
4. Recalculate: completedPercent
5. Check: Is puzzle complete? (all paintedGrid cells === 1 where targetGrid > 0)

### ImageConverter
**Responsibilities:**
- Read uploaded File
- Canvas resize to 32x32
- Color quantization (reduce to ≤8 colors)
- Generate grid mapping

**Algorithm:**
1. Draw image to 32x32 canvas
2. Read pixel data
3. K-means clustering to find dominant colors (max 8)
4. Map each pixel to nearest cluster center
5. Build grid and palette

## User Flow

```
App Load
  ↓
HomeView → Show card grid (load from LocalStorage)
  ↓
User clicks "Import" → ImportModal opens
  - Select image
  - Processing...
  - Navigate to EditorView

HomeView (continued)
  ↓
User clicks existing puzzle → Navigate to EditorView

EditorView
  ↓
Load puzzle data
  - Render canvas with numbers/colors
  - Show palette
  ↓
Player clicks pixel + color → Update grid
  - Save to LocalStorage
  - Update progress
  - Re-render affected area only
  ↓
All pixels painted → Celebration animation
  ↓
User clicks back → Destroy EditorView, mount HomeView
```

## Responsive Design

**Breakpoints:**
- **Mobile:** < 1024px (phones and small tablets)
- **Desktop:** ≥ 1024px (tablets landscape and larger)

**HomeView Responsive Behavior:**
- **Mobile:** 2 column grid, full-width cards
- **Desktop:** 4-6 column grid
- Cards maintain 1:1 aspect ratio
- Import button fixed at bottom (mobile) or top-right (desktop)

**EditorView Responsive Behavior:**
- **Canvas:** Responsive container, maintains aspect ratio
  - Mobile: Canvas takes full width minus padding (min 300px, max 100vw)
  - Desktop: Max width 800px, centered
- **Palette:** Horizontal scroll on mobile, grid on desktop
- **Toolbar:** Stacked on mobile, horizontal on desktop
- **Canvas initial scale:** Auto-fit to container on load

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Palette buttons: 48x48px on mobile
- Zoom controls: +/- buttons visible on mobile (gestures secondary)

## Visual Design

**Color Scheme:**
- Background: #1a0f2e (deep purple)
- Card background: #2d1b4e (warm purple)
- Accent: #ff6b35 (funky orange)
- Accent secondary: #f7931e (warm yellow-orange)
- Highlight: #ff006e (hot pink)
- Text: #fff5e6 (warm off-white)
- Grid lines: #4a1c4a (muted purple)

**Typography:**
- System fonts, sans-serif
- Card titles: 16px on desktop, 14px on mobile
- Numbers on grid: Scale with zoom (min 8px, max 20px)
- Progress text: 14px on desktop, 12px on mobile

## Browser Support
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **Minimum:** ES6, CSS Grid, Touch Events, Pointer Events API
- **Gestures:** 
  - Pinch-to-zoom via Pointer Events (multi-touch)
  - Pan via standard touch events
  - Passive event listeners for scroll performance

## Performance Considerations
- Canvas operations: Use `putImageData` for batch updates
- Thumbnail generation: Debounced on paint
- LocalStorage: <5MB total, puzzle objects ~10KB each

## Future Enhancements (Out of Scope)
- Undo/redo functionality
- Share puzzles via URL
- Multiple grid sizes (16x16, 64x64)
- Sound effects on paint completion
- Achievements/progression system
- Haptic feedback on mobile
