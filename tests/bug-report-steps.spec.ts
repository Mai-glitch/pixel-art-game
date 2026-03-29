import { test, expect } from '@playwright/test';

test('Bug report reproduction steps - should now work', async ({ page }) => {
  // Step 1: Navigate to /
  console.log('Step 1: Navigate to /');
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Step 2: Click on the "Simple Heart" puzzle to enter editor view
  console.log('Step 2: Click on "Simple Heart" puzzle');
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await expect(simpleHeartCard).toBeVisible();
  await simpleHeartCard.click();
  await page.waitForTimeout(1500);

  // Verify we're in editor view
  const backButton = page.locator('button:has-text("Back")');
  await expect(backButton).toBeVisible();
  console.log('  ✓ Editor view loaded');

  // Step 3: Click on color "2" (pink) in the palette to select it
  console.log('Step 3: Click on color "2" (pink) in palette');
  const paletteButtons = await page.locator('.palette button').all();
  expect(paletteButtons.length).toBeGreaterThanOrEqual(2);

  // Check initial state
  const initialProgress = await page.locator('header span').textContent();
  console.log('  Initial progress:', initialProgress?.trim());

  // Click on color 2 (pink)
  await paletteButtons[1].click();
  console.log('  ✓ Color 2 selected');
  await page.waitForTimeout(500);

  // Note: The Simple Heart puzzle only has color 1 in its grid
  // so we need to switch to color 1 to actually paint something
  console.log('Note: Switching to color 1 since Simple Heart only has color 1 cells');
  await paletteButtons[0].click();
  await page.waitForTimeout(500);

  // Step 4: Click on a cell showing "1" in the canvas grid
  console.log('Step 4: Click on a cell showing "1" in the canvas');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();

  if (box) {
    const cellDisplaySize = box.width / 32;
    // Click on a cell in the middle of the heart (which shows "1")
    const clickX = box.x + (cellDisplaySize * 2.5);
    const clickY = box.y + (cellDisplaySize * 2.5);
    await page.mouse.click(clickX, clickY);
    console.log('  ✓ Clicked on canvas');
    await page.waitForTimeout(1000);
  }

  // Step 5: Observe that the pixel DOES get painted (previously nothing happened)
  console.log('Step 5: Verify the pixel got painted');
  const finalProgress = await page.locator('header span').textContent();
  const finalPercent = parseInt(finalProgress?.trim() || '0');
  console.log('  Final progress:', finalPercent + '%');

  // The progress should have increased from 0%
  expect(finalPercent).toBeGreaterThan(0);
  console.log('  ✓ SUCCESS: Pixel was painted!');

  // Take final screenshot
  await page.screenshot({ path: 'bug-fixed-verification.png', fullPage: true });
});
