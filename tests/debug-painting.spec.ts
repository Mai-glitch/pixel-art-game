import { test, expect } from '@playwright/test';

test('Debug painting issue', async ({ page }) => {
  // Capture all console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // Navigate to the application
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on "Simple Heart" puzzle
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await expect(simpleHeartCard).toBeVisible();
  await simpleHeartCard.click();
  await page.waitForTimeout(1000);

  // Check if we're on the editor view
  const backButton = page.locator('button:has-text("Back")');
  await expect(backButton).toBeVisible();

  // Take a snapshot to see the current state
  const content = await page.content();
  console.log('Page HTML length:', content.length);

  // Try to find and click on color 2 (pink) in the palette
  const paletteButtons = await page.locator('.palette button').all();
  console.log(`Found ${paletteButtons.length} palette buttons`);

  if (paletteButtons.length >= 2) {
    // Click on the second color button (index 1, which is color 2)
    await paletteButtons[1].click();
    console.log('Clicked on palette button 2');
    await page.waitForTimeout(500);
  }

  // Try to click on the canvas
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Get canvas bounds
  const bounds = await canvas.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  console.log('Canvas bounds:', bounds);

  // Click in the center of the canvas
  const clickX = bounds.x + bounds.width / 2;
  const clickY = bounds.y + bounds.height / 2;
  console.log(`Clicking at: ${clickX}, ${clickY}`);

  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);

  // Print all console messages
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('========================\n');

  // Take a screenshot
  await page.screenshot({ path: 'painting-debug.png' });
});
