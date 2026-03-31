import { test, expect } from '@playwright/test';

test.describe('Smooth Painting with Line Interpolation', () => {
  const testPuzzle = {
    id: 'test-smooth-painting',
    name: 'Test Smooth Painting',
    // Create a horizontal line pattern
    targetGrid: Array(32).fill(null).map((_, y) => 
      Array(32).fill(null).map((_, x) => y === 16 ? 1 : 0)
    ),
    paintedGrid: Array(32).fill(null).map(() => Array(32).fill(0)),
    palette: ['#FF6B6B'],
    completedPercent: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  test.beforeEach(async ({ page }) => {
    // Inject test puzzle into storage (using correct key: pixelart_puzzles)
    await page.goto('/');
    await page.evaluate((puzzle) => {
      localStorage.setItem('pixelart_puzzles', JSON.stringify([puzzle]));
    }, testPuzzle);
    // Navigate to puzzle editor (using editor route)
    await page.goto('/#editor/' + testPuzzle.id);
    await page.waitForSelector('#editor-view', { timeout: 5000 });
  });

  test('should paint all pixels when moving mouse quickly', async ({ page }) => {
    // Select color 1 from the palette
    const paletteButtons = await page.locator('.palette button').all();
    await paletteButtons[1].click(); // Index 1 is the first color (index 0 is eraser)
    await page.waitForTimeout(300);

    // Get canvas dimensions
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (!box) return;
    
    const cellSize = box.width / 32;
    const rowY = box.y + (16 * cellSize) + (cellSize / 2); // Middle row (y=16)
    const startX = box.x + (5 * cellSize) + (cellSize / 2);
    const endX = box.x + (26 * cellSize) + (cellSize / 2);
    
    // Move to start position
    await page.mouse.move(startX, rowY);
    await page.waitForTimeout(100);
    
    // Start painting
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    // Move quickly to end position (simulating fast mouse movement)
    await page.mouse.move(endX, rowY, { steps: 3 }); // Only 3 steps = fast movement
    await page.waitForTimeout(100);
    
    // Stop painting
    await page.mouse.up();
    await page.waitForTimeout(300);
    
    // Verify progress indicates most of the row was painted
    // Use first() to get the first match (the progress span, not zoom label)
    const progressText = await page.locator('header span:text-matches("[0-9]+%")').first().textContent();
    const percent = parseInt(progressText || '0');
    
    // Should have at least 15% completion
    expect(percent).toBeGreaterThan(15);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smooth-painting-test.png', fullPage: true });
  });

  test('should paint diagonal lines correctly', async ({ page }) => {
    // Create diagonal puzzle
    const diagonalPuzzle = {
      id: 'test-diagonal',
      name: 'Test Diagonal',
      targetGrid: Array(32).fill(null).map((_, y) => 
        Array(32).fill(null).map((_, x) => x === y ? 1 : 0) // Diagonal line
      ),
      paintedGrid: Array(32).fill(null).map(() => Array(32).fill(0)),
      palette: ['#4ECDC4'],
      completedPercent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await page.goto('/');
    await page.evaluate((puzzle) => {
      localStorage.setItem('pixelart_puzzles', JSON.stringify([puzzle]));
    }, diagonalPuzzle);
    await page.goto('/#editor/' + diagonalPuzzle.id);
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    // Select color 1
    const paletteButtons = await page.locator('.palette button').all();
    await paletteButtons[1].click();
    await page.waitForTimeout(300);
    
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    
    if (!box) return;
    
    const cellSize = box.width / 32;
    
    // Paint along diagonal from (5,5) to (26,26)
    const startX = box.x + (5 * cellSize) + (cellSize / 2);
    const startY = box.y + (5 * cellSize) + (cellSize / 2);
    const endX = box.x + (26 * cellSize) + (cellSize / 2);
    const endY = box.y + (26 * cellSize) + (cellSize / 2);
    
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(endX, endY, { steps: 4 }); // Fast diagonal movement
    await page.waitForTimeout(100);
    await page.mouse.up();
    await page.waitForTimeout(300);
    
    // Verify good progress on diagonal
    // Use first() to get the first match (the progress span, not zoom label)
    const progressText = await page.locator('header span:text-matches("[0-9]+%")').first().textContent();
    const percent = parseInt(progressText || '0');
    
    // Should have at least 10% completion
    expect(percent).toBeGreaterThan(10);
  });
});
