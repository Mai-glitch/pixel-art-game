import { test, expect } from '@playwright/test';

test('Debug with console logging', async ({ page }) => {
  const consoleLogs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('CONSOLE:', text);
  });

  // Navigate to the app
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on Simple Heart
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await simpleHeartCard.click();
  await page.waitForTimeout(2000);

  // Click on first color in palette
  const paletteButtons = await page.locator('.palette button').all();
  console.log(`Found ${paletteButtons.length} palette buttons`);

  if (paletteButtons.length > 0) {
    await paletteButtons[0].click();
    console.log('Clicked on color 1');
    await page.waitForTimeout(500);
  }

  // Get canvas and click at specific position
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  console.log('Canvas box:', box);

  if (box) {
    // The heart is 6x6 pixels displayed in a 32x14 cell grid
    // Each cell is displayed at roughly box.width/32
    const cellDisplaySize = box.width / 32;
    console.log('Cell display size:', cellDisplaySize);

    // Click at the center of cell (2, 2) - 3rd row, 3rd column (0-indexed)
    // This is within the heart shape
    const clickX = box.x + (cellDisplaySize * 2) + (cellDisplaySize / 2);
    const clickY = box.y + (cellDisplaySize * 2) + (cellDisplaySize / 2);
    console.log(`Clicking at: ${clickX}, ${clickY}`);

    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
  }

  // Get progress
  const progress = await page.locator('header span').textContent();
  console.log('Final progress:', progress);

  // Print all console logs
  console.log('\n=== All Console Logs ===');
  consoleLogs.filter(log => log.includes('paint')).forEach(log => console.log(log));
  console.log('========================\n');

  // Take screenshot
  await page.screenshot({ path: 'debug-console.png', fullPage: true });
});
