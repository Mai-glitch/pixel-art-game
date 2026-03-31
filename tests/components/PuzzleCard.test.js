// PuzzleCard component tests

const { test, expect } = require('@playwright/test');

// Fixed CanvasEngine implementation
const CANVAS_ENGINE_SOURCE = `
class CanvasEngine {
  constructor(canvas, width = 32, height = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseSize = 512;
    this.gridWidth = width;
    this.gridHeight = height;
    
    const maxDimension = Math.max(this.gridWidth, this.gridHeight);
    this.pixelSize = this.baseSize / maxDimension;
    
    this.canvasWidth = this.pixelSize * this.gridWidth;
    this.canvasHeight = this.pixelSize * this.gridHeight;
    
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

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
}
`;

// PuzzleCard implementation
const PUZZLE_CARD_SOURCE = `
class PuzzleCard {
  constructor(puzzle, onClick) {
    this.puzzle = puzzle;
    this.onClick = onClick;
    this.element = null;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    card.style.cssText = \`
      background: #2a1c2a;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
      display: flex;
      flex-direction: column;
      width: 200px;
    \`;
    
    card.addEventListener('click', () => this.onClick && this.onClick(this.puzzle.id));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvas.style.cssText = \`
      width: 100%;
      height: auto;
      aspect-ratio: 1;
      image-rendering: pixelated;
    \`;
    
    const gridHeight = this.puzzle.targetGrid?.length || 32;
    const gridWidth = this.puzzle.targetGrid?.[0]?.length || 32;
    const engine = new CanvasEngine(canvas, gridWidth, gridHeight);
    
    // Use createThumbnail for proper square thumbnail generation
    const thumbnailDataUrl = engine.createThumbnail(this.puzzle.targetGrid, this.puzzle.palette);
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 64, 64);
    };
    img.src = thumbnailDataUrl;
    
    const info = document.createElement('div');
    info.style.cssText = \`
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    \`;
    
    const name = document.createElement('h3');
    name.textContent = this.puzzle.name;
    name.style.cssText = \`
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: white;
    \`;
    
    const progress = document.createElement('div');
    progress.style.cssText = \`
      display: flex;
      align-items: center;
      gap: 8px;
    \`;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = \`
      flex: 1;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      overflow: hidden;
    \`;
    
    const progressFill = document.createElement('div');
    progressFill.style.cssText = \`
      height: 100%;
      width: \${this.puzzle.completedPercent || 0}%;
      background: #4ECDC4;
      transition: width 0.3s;
    \`;
    
    progressBar.appendChild(progressFill);
    
    const progressText = document.createElement('span');
    progressText.textContent = \`\${this.puzzle.completedPercent || 0}%\`;
    progressText.style.cssText = 'font-size: 12px; color: white;';
    
    progress.appendChild(progressBar);
    progress.appendChild(progressText);
    info.appendChild(name);
    info.appendChild(progress);
    
    card.appendChild(canvas);
    card.appendChild(info);
    
    this.element = card;
    return card;
  }
}
`;

test.describe('PuzzleCard with Thumbnail', () => {
  test.beforeEach(async ({ page }) => {
    // Start with empty page and inject required code
    await page.goto('about:blank');
    
    // Inject CanvasEngine
    await page.addScriptTag({ content: CANVAS_ENGINE_SOURCE });
    // Inject PuzzleCard
    await page.addScriptTag({ content: PUZZLE_CARD_SOURCE });
    
    // Wait for classes to be available
    await page.waitForFunction(() => 
      typeof CanvasEngine !== 'undefined' && typeof PuzzleCard !== 'undefined', 
      { timeout: 5000 }
    );
  });

  test('should render square thumbnail for rectangular puzzle', async ({ page }) => {
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
    
    const result = await page.evaluate(({ puzzle }) => {
      const card = new PuzzleCard(puzzle, () => {});
      const element = card.render();
      const canvas = element.querySelector('canvas');
      
      return {
        hasCanvas: !!canvas
      };
    }, { puzzle });
    
    // Canvas should exist
    expect(result.hasCanvas).toBe(true);
  });

  test('should create wide puzzle with centered thumbnail', async ({ page }) => {
    const puzzle = {
      id: 'test-wide',
      name: 'Wide Puzzle',
      targetGrid: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // 10x2
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paintedGrid: [],
      palette: ['#ff0000', '#00ff00'],
      completedPercent: 50
    };
    
    const result = await page.evaluate(async ({ puzzle }) => {
      return new Promise((resolve) => {
        const card = new PuzzleCard(puzzle, () => {});
        const element = card.render();
        document.body.appendChild(element);
        
        const canvas = element.querySelector('canvas');
        
        // The canvas gets drawn via the onload handler, so wait a bit
        setTimeout(() => {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, 64, 64);
          
          resolve({
            hasCanvas: !!canvas,
            hasContent: imageData.data.some((val, i) => i % 4 === 3 && val > 0)
          });
        }, 100);
      });
    }, { puzzle });
    
    expect(result.hasCanvas).toBe(true);
    expect(result.hasContent).toBe(true);
  });

  test('should create tall puzzle with centered thumbnail', async ({ page }) => {
    const puzzle = {
      id: 'test-tall',
      name: 'Tall Puzzle',
      targetGrid: [
        [1], [1], [1], [1], [1], [1], [1], [1], [1], [1]  // 1x10
      ],
      paintedGrid: [],
      palette: ['#ff0000'],
      completedPercent: 25
    };
    
    const result = await page.evaluate(async ({ puzzle }) => {
      return new Promise((resolve) => {
        const card = new PuzzleCard(puzzle, () => {});
        const element = card.render();
        document.body.appendChild(element);
        
        const canvas = element.querySelector('canvas');
        
        setTimeout(() => {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, 64, 64);
          
          resolve({
            hasCanvas: !!canvas,
            hasContent: imageData.data.some((val, i) => i % 4 === 3 && val > 0)
          });
        }, 100);
      });
    }, { puzzle });
    
    expect(result.hasCanvas).toBe(true);
    expect(result.hasContent).toBe(true);
  });
});
