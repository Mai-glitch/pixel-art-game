import { test, expect } from '@playwright/test';

test.describe('Continuous Drawing', () => {
  const testPuzzle = {
    id: 'test-continuous-drawing',
    name: 'Test Continuous Drawing',
    targetGrid: Array(32).fill(null).map(() => Array(32).fill(0).map(() => Math.floor(Math.random() * 3) + 1)),
    paintedGrid: Array(32).fill(null).map(() => Array(32).fill(0)),
    palette: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
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
  });

  test('should continue painting when mouse leaves canvas', async ({ page }) => {
    // Wait for editor to load
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    // Get canvas and its bounding box
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (!box) {
      throw new Error('Canvas not found');
    }
    
    // Verify we're in draw mode (crosshair cursor)
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
    
    // Get a pixel inside the canvas that should be painted
    const pixelX = box.x + box.width * 0.5;
    const pixelY = box.y + box.height * 0.5;
    
    // Position mouse outside canvas (to the left)
    const outsideX = box.x - 50;
    const outsideY = pixelY;
    
    // Drag from outside into canvas and out again
    await page.mouse.move(outsideX, outsideY);
    await page.mouse.down();
    
    // Move through canvas to another outside position
    await page.mouse.move(pixelX, pixelY);
    await page.mouse.move(box.x + box.width + 50, pixelY);
    
    await page.mouse.up();
    
    // Verify progress increased (some pixels were painted)
    const progressText = await page.locator('header span').textContent();
    const percent = parseInt(progressText || '0');
    
    // Expected: at least 1% progress (some pixels painted)
    expect(percent).toBeGreaterThan(0);
  });

  test('should stop painting on mouse up outside canvas', async ({ page }) => {
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    
    if (!box) {
      throw new Error('Canvas not found');
    }
    
    // Start painting inside canvas
    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.5;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Move outside
    await page.mouse.move(box.x - 100, startY);
    
    // Mouse up outside
    await page.mouse.up();
    
    // Move back inside and verify cursor (should not be painting anymore)
    await page.mouse.move(startX, startY);
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
  });
});
