import { test, expect } from '@playwright/test';

test.describe('Variable Puzzle Dimensions', () => {
  test('CanvasEngine should render rectangular grids correctly (16x24)', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const targetGrid = Array(24).fill(null).map(() => Array(16).fill(1));
      const paintedGrid = Array(24).fill(null).map(() => Array(16).fill(0));
      const palette = ['#ff6b35'];
      
      const engine = new (window as any).CanvasEngine(canvas, 16, 24);
      engine.render(targetGrid, paintedGrid, palette);
      
      return {
        gridWidth: engine.gridWidth,
        gridHeight: engine.gridHeight,
        pixelSize: engine.pixelSize
      };
    });
    
    expect(result.gridWidth).toBe(16);
    expect(result.gridHeight).toBe(24);
  });
  
  test('CanvasEngine should default to 32x32', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const engine = new (window as any).CanvasEngine(canvas);
      
      return {
        gridWidth: engine.gridWidth,
        gridHeight: engine.gridHeight,
        pixelSize: engine.pixelSize
      };
    });
    
    expect(result.gridWidth).toBe(32);
    expect(result.gridHeight).toBe(32);
    expect(result.pixelSize).toBe(16);
  });
  
  test('CanvasEngine should handle 24x24', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const engine = new (window as any).CanvasEngine(canvas, 24, 24);
      
      return {
        gridWidth: engine.gridWidth,
        gridHeight: engine.gridHeight
      };
    });
    
    expect(result.gridWidth).toBe(24);
    expect(result.gridHeight).toBe(24);
  });
});

test.describe('ImageConverter variable dimensions', () => {
  test('ImageConverter should convert image to custom rectangular size (16x24)', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(async () => {
      const converter = new (window as any).ImageConverter(16, 24);
      
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 16;
      testCanvas.height = 24;
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 16, 24);
      
      const blob = await new Promise<Blob>((resolve) => {
        testCanvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      const puzzle = await converter.convertImage(file, 'Test Puzzle');
      
      return {
        gridHeight: puzzle.targetGrid.length,
        gridWidth: puzzle.targetGrid[0].length
      };
    });
    
    expect(result.gridHeight).toBe(24);
    expect(result.gridWidth).toBe(16);
  });
  
  test('ImageConverter should default to 32x32', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const converter = await page.evaluate(() => {
      const c = new (window as any).ImageConverter();
      return {
        gridWidth: c.gridWidth,
        gridHeight: c.gridHeight
      };
    });
    
    expect(converter.gridWidth).toBe(32);
    expect(converter.gridHeight).toBe(32);
  });
});
