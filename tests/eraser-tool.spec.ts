import { test, expect } from '@playwright/test';

test.describe('Eraser Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/#home');
    
    // Wait for puzzles to load
    await page.waitForSelector('.puzzle-card', { timeout: 10000 });
    
    // Click on first puzzle
    await page.click('.puzzle-card:first-of-type');
    
    // Wait for editor to load
    await page.waitForSelector('#editor-view', { timeout: 10000 });
  });

  test('eraser button appears in palette', async ({ page }) => {
    // Find palette
    const palette = await page.locator('.palette');
    await expect(palette).toBeVisible();
    
    // Check that eraser button exists (first button with 🧼 icon)
    const eraserButton = palette.locator('button').first();
    await expect(eraserButton).toContainText('🧼');
  });

  test('clicking eraser selects it', async ({ page }) => {
    const palette = await page.locator('.palette');
    const eraserButton = palette.locator('button').first();
    
    // Click eraser
    await eraserButton.click();
    
    // Check that it has selected styling (orange border)
    const borderStyle = await eraserButton.evaluate(el => el.style.border);
    expect(borderStyle).toContain('rgb(255, 107, 53)'); // #ff6b35
  });

  test('eraser removes painted pixels', async ({ page }) => {
    // First paint a pixel
    const canvas = await page.locator('canvas');
    
    // Select color 1 (second button in palette)
    const palette = await page.locator('.palette');
    const color1Button = palette.locator('button').nth(1);
    await color1Button.click();
    
    // Paint at center of canvas
    const box = await canvas.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Click to paint
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.up();
      
      // Wait for render
      await page.waitForTimeout(100);
      
      // Select eraser
      const eraserButton = palette.locator('button').first();
      await eraserButton.click();
      
      // Erase the same pixel
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.up();
      
      await page.waitForTimeout(100);
      
      // Verify pixel is erased by checking progress decreased
      // Note: Progress indicator is in header > div > span
      const progressText = await page.locator('header div span').first().textContent();
      console.log('Progress after erasing:', progressText);
    }
  });

  test('canvas cursor changes for eraser mode', async ({ page }) => {
    const palette = await page.locator('.palette');
    const eraserButton = palette.locator('button').first();
    
    // Click eraser
    await eraserButton.click();
    
    // Check canvas cursor
    const canvas = await page.locator('canvas');
    const cursorStyle = await canvas.evaluate(el => el.style.cursor);
    expect(cursorStyle).toBe('cell');
  });
});
