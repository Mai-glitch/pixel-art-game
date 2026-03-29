import { test, expect } from '@playwright/test';

test('Debug paint logic with detailed logging', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on "Simple Heart" puzzle
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await expect(simpleHeartCard).toBeVisible();
  await simpleHeartCard.click();
  await page.waitForTimeout(1000);

  // Inject debug logging into the page
  await page.evaluate(() => {
    // Override the paintAt method to add logging
    const originalPaintAt = (window as any).EditorView?.prototype?.paintAt;
    if (originalPaintAt) {
      (window as any).EditorView.prototype.paintAt = function(x: number, y: number) {
        console.log('paintAt called with:', { x, y });
        console.log('selectedColor:', this.selectedColor);
        console.log('engine:', this.engine);
        return originalPaintAt.call(this, x, y);
      };
    }

    // Log when page is ready
    console.log('Debug logging injected');
  });

  // Get detailed info about the puzzle
  const puzzleInfo = await page.evaluate(() => {
    // Find the canvas and get its context
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };

    // Try to access internal state through DOM inspection
    const editorDiv = document.getElementById('editor-view');
    if (!editorDiv) return { error: 'No editor-view found' };

    // Get palette info
    const palette = document.querySelector('.palette');
    const paletteButtons = palette?.querySelectorAll('button');

    return {
      canvasSize: { width: canvas.width, height: canvas.height },
      canvasDisplaySize: { width: canvas.clientWidth, height: canvas.clientHeight },
      paletteButtonCount: paletteButtons?.length || 0,
      editorHTML: editorDiv.innerHTML.substring(0, 500)
    };
  });
  console.log('Puzzle info:', puzzleInfo);

  // Click on color 1 (white)
  const paletteButtons = await page.locator('.palette button').all();
  console.log(`Found ${paletteButtons.length} palette buttons`);

  if (paletteButtons.length > 0) {
    await paletteButtons[0].click();
    console.log('Selected color 1');
    await page.waitForTimeout(500);

    // Verify selection
    const selectedBorder = await paletteButtons[0].evaluate(el => {
      return window.getComputedStyle(el).borderColor;
    });
    console.log('Selected button border:', selectedBorder);
  }

  // Try to paint on the canvas in a location we know has a "1"
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  console.log('Canvas bounding box:', bounds);

  if (bounds) {
    // Paint at several positions
    // The canvas is 6x6 pixels displayed at various sizes
    // Each cell is roughly bounds.width / 6 by bounds.height / 6
    const cellWidth = bounds.width / 6;
    const cellHeight = bounds.height / 6;

    // Try painting at cell (2, 2) - the 3rd row, 3rd column (0-indexed)
    // This should be in the middle of the heart where there's a "1"
    const paintX = bounds.x + cellWidth * 2.5;
    const paintY = bounds.y + cellHeight * 2.5;

    console.log(`Attempting to paint at cell (2,2) - coordinates: ${paintX}, ${paintY}`);
    await page.mouse.click(paintX, paintY);
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'debug-paint-attempt.png', fullPage: true });
  }

  // Get final progress to see if anything was painted
  const progress = await page.locator('header span').textContent();
  console.log('Final progress:', progress);

  // Capture console logs
  const logs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  console.log('Console logs:', logs);
});
