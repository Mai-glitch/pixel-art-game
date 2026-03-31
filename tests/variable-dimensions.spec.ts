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

test.describe('ImageConverter auto-resize with ratio preservation', () => {
  test('ImageConverter should resize wide image to max 100x100 preserving ratio', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(async () => {
      const converter = new (window as any).ImageConverter(100);
      
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 200;
      testCanvas.height = 100;
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 200, 100);
      
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
    
    expect(result.gridWidth).toBe(100);
    expect(result.gridHeight).toBe(50);
  });
  
  test('ImageConverter should resize tall image to max 100x100 preserving ratio', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(async () => {
      const converter = new (window as any).ImageConverter(100);
      
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 100;
      testCanvas.height = 200;
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 200);
      
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
    
    expect(result.gridWidth).toBe(50);
    expect(result.gridHeight).toBe(100);
  });
  
  test('ImageConverter should keep original size if smaller than max', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(async () => {
      const converter = new (window as any).ImageConverter(100);
      
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 50;
      testCanvas.height = 30;
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 50, 30);
      
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
    
    expect(result.gridWidth).toBe(50);
    expect(result.gridHeight).toBe(30);
  });
  
  test('ImageConverter should calculate dimensions correctly', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const dimensions = await page.evaluate(() => {
      const converter = new (window as any).ImageConverter(100);
      return {
        wide: converter.calculateDimensions(200, 100),
        tall: converter.calculateDimensions(100, 200),
        small: converter.calculateDimensions(50, 30),
        square: converter.calculateDimensions(150, 150)
      };
    });
    
    expect(dimensions.wide).toEqual({ width: 100, height: 50 });
    expect(dimensions.tall).toEqual({ width: 50, height: 100 });
    expect(dimensions.small).toEqual({ width: 50, height: 30 });
    expect(dimensions.square).toEqual({ width: 100, height: 100 });
  });
});
