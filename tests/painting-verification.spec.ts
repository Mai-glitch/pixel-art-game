import { test, expect } from '@playwright/test';

test('painting functionality works correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on Simple Heart puzzle
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await expect(simpleHeartCard).toBeVisible();
  await simpleHeartCard.click();
  await page.waitForTimeout(1500);

  // Verify we're in the editor
  const backButton = page.locator('button:has-text("Retour")');
  await expect(backButton).toBeVisible();

  // Get initial progress
  const initialProgress = await page.locator('header span').textContent();
  const initialPercent = parseInt(initialProgress?.trim() || '0');
  console.log('Initial progress:', initialPercent + '%');
  expect(initialPercent).toBe(0);

  // Select color 1 from the palette
  const paletteButtons = await page.locator('.palette button').all();
  expect(paletteButtons.length).toBeGreaterThan(0);

  await paletteButtons[0].click();
  console.log('Selected color 1');
  await page.waitForTimeout(500);

  // Get canvas and click on a cell displaying "1"
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  if (box) {
    // The heart is a 6x6 grid displayed on a 32x32 grid canvas
    // Each cell is roughly box.width/32 pixels
    const cellDisplaySize = box.width / 32;

    // Click on cell (2, 2) - 3rd row, 3rd column - which should have a "1" in the heart
    const clickX = box.x + (cellDisplaySize * 2.5);
    const clickY = box.y + (cellDisplaySize * 2.5);

    console.log(`Clicking on canvas at: ${clickX.toFixed(1)}, ${clickY.toFixed(1)}`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
  }

  // Get final progress - should have increased
  const finalProgress = await page.locator('header span').textContent();
  const finalPercent = parseInt(finalProgress?.trim() || '0');
  console.log('Final progress:', finalPercent + '%');

  // Verify that painting worked
  expect(finalPercent).toBeGreaterThan(initialPercent);
  console.log('SUCCESS: Painting is working! Progress increased from', initialPercent, '% to', finalPercent, '%');

  // Take screenshot for verification
  await page.screenshot({ path: 'painting-verification-fixed.png', fullPage: true });
});

test('multiple painting actions accumulate progress', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on Simple Heart puzzle
  await page.locator('text=Simple Heart').first().click();
  await page.waitForTimeout(1500);

  // Select color 1
  const paletteButtons = await page.locator('.palette button').all();
  await paletteButtons[0].click();
  await page.waitForTimeout(300);

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  if (box) {
    const cellDisplaySize = box.width / 32;

    // Paint multiple cells in the heart
    const paintPositions = [
      { x: 2.5, y: 2.5 },
      { x: 3.5, y: 2.5 },
      { x: 2.5, y: 3.5 },
      { x: 3.5, y: 3.5 },
    ];

    for (const pos of paintPositions) {
      const clickX = box.x + (cellDisplaySize * pos.x);
      const clickY = box.y + (cellDisplaySize * pos.y);
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(300);
    }
  }

  // Get final progress
  const finalProgress = await page.locator('header span').textContent();
  const finalPercent = parseInt(finalProgress?.trim() || '0');
  console.log('Progress after multiple paints:', finalPercent + '%');

  // Should have painted 4 cells (or fewer if some were already painted)
  expect(finalPercent).toBeGreaterThanOrEqual(4);
});
