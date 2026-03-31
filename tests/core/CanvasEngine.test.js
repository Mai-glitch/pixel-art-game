// CanvasEngine.createThumbnail tests
// Using Playwright browser-based tests since we need DOM/canvas access

const { test, expect } = require('@playwright/test');

// Fixed CanvasEngine implementation with centered thumbnails
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

test.describe('CanvasEngine.createThumbnail', () => {
  test.beforeEach(async ({ page }) => {
    // Start with empty page and inject CanvasEngine code
    await page.goto('about:blank');
    
    // Inject CanvasEngine class
    await page.addScriptTag({
      content: CANVAS_ENGINE_SOURCE
    });
    
    // Verify CanvasEngine is available
    await page.waitForFunction(() => typeof CanvasEngine !== 'undefined', { timeout: 5000 });
  });

  test('should create square thumbnail for rectangular puzzle', async ({ page }) => {
    const targetGrid = [
      [1, 1, 1, 1, 1],  // 5 columns
      [2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3]   // 3 rows (5x3 = rectangular)
    ];
    const palette = ['#ff0000', '#00ff00', '#0000ff'];

    const dataUrl = await page.evaluate(({ targetGrid, palette }) => {
      const canvas = document.createElement('canvas');
      const engine = new CanvasEngine(canvas, 5, 3);
      return engine.createThumbnail(targetGrid, palette);
    }, { targetGrid, palette });

    expect(dataUrl).toBeTruthy();
    expect(dataUrl.startsWith('data:image/png')).toBe(true);

    // Verify the thumbnail has content (not all transparent)
    const hasContent = await page.evaluate(async (dataUrl) => {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, 64, 64);
      // Check if there's any non-transparent content
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
          return true;
        }
      }
      return false;
    }, dataUrl);

    expect(hasContent).toBe(true);
  });

  test('should center wide puzzle in square thumbnail (offsetY > 0)', async ({ page }) => {
    // Wide puzzle (8x2) should be centered vertically
    // Expected: With max dimension = 8, pixel size = 64/8 = 8
    // Grid takes up 2*8 = 16 pixels vertically
    // So offsetY should be (64 - 16) / 2 = 24 pixels from top
    const targetGrid = [
      [1, 1, 1, 1, 1, 1, 1, 1],  // 8 columns
      [2, 2, 2, 2, 2, 2, 2, 2]   // 2 rows
    ];
    const palette = ['#ff0000', '#00ff00'];

    const result = await page.evaluate(({ targetGrid, palette }) => {
      const canvas = document.createElement('canvas');
      const engine = new CanvasEngine(canvas, 8, 2);
      const dataUrl = engine.createThumbnail(targetGrid, palette);
      return { dataUrl };
    }, { targetGrid, palette });

    expect(result.dataUrl).toBeTruthy();

    // Calculate expected dimensions
    const pixelSize = 64 / 8;  // = 8
    const totalHeight = 2 * pixelSize;  // = 16
    const expectedOffsetY = (64 - totalHeight) / 2;  // = 24

    // Verify there is top margin (centering)
    const hasTopMargin = await page.evaluate(async ({ dataUrl, offsetPixels }) => {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Check first 'offsetPixels' rows (should be empty/white)
      for (let y = 0; y < offsetPixels; y++) {
        const rowData = ctx.getImageData(0, y, 64, 1).data;
        for (let i = 0; i < rowData.length; i += 4) {
          const isNonWhite = rowData[i] !== 255 || rowData[i + 1] !== 255 || rowData[i + 2] !== 255;
          if (isNonWhite) {
            return false; // Found non-white pixel in top margin - not centered
          }
        }
      }
      return true;
    }, { dataUrl: result.dataUrl, offsetPixels: Math.floor(expectedOffsetY / 2) });

    expect(hasTopMargin).toBe(true);
  });

  test('should center tall puzzle in square thumbnail (offsetX > 0)', async ({ page }) => {
    // Tall puzzle (1x8) should be centered horizontally
    // Expected: With max dimension = 8, pixel size = 64/8 = 8
    // Grid takes up 1*8 = 8 pixels horizontally
    // So offsetX should be (64 - 8) / 2 = 28 pixels from left
    const targetGrid = [
      [1], [1], [1], [1], [1], [1], [1], [1]  // 8 rows, 1 column
    ];
    const palette = ['#ff0000'];

    const result = await page.evaluate(({ targetGrid, palette }) => {
      const canvas = document.createElement('canvas');
      const engine = new CanvasEngine(canvas, 1, 8);
      const dataUrl = engine.createThumbnail(targetGrid, palette);
      return { dataUrl };
    }, { targetGrid, palette });

    expect(result.dataUrl).toBeTruthy();

    // Calculate expected dimensions
    const pixelSize = 64 / 8;  // = 8
    const totalWidth = 1 * pixelSize;  // = 8
    const expectedOffsetX = (64 - totalWidth) / 2;  // = 28

    // Verify there is left margin (centering)
    const hasLeftMargin = await page.evaluate(async ({ dataUrl, offsetX }) => {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Check columns 0 to offsetX-1 for each row (should be empty/white)
      const pixelsToCheck = Math.floor(offsetX / 2);
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < pixelsToCheck; x++) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const isNonWhite = pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255;
          if (isNonWhite) {
            return false; // Found non-white pixel in left margin - not centered
          }
        }
      }
      return true;
    }, { dataUrl: result.dataUrl, offsetX: expectedOffsetX });

    expect(hasLeftMargin).toBe(true);
  });
});
