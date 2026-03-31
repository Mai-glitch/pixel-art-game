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
