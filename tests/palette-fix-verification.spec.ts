import { test, expect } from '@playwright/test';

test('palette should not duplicate when color is selected', async ({ page }) => {
  // Navigate to the page
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  // Click on the Simple Heart puzzle card
  console.log('Looking for Simple Heart puzzle...');
  const puzzleCard = page.locator('.puzzle-card', { hasText: /Simple Heart/i });
  await puzzleCard.waitFor({ timeout: 5000 });
  await puzzleCard.click();
  
  // Wait for editor to load
  await page.waitForTimeout(2000);
  
  // Check that palette exists
  const palette = page.locator('.palette');
  await palette.waitFor({ timeout: 5000 });
  
  // Count initial palette buttons
  const initialButtonCount = await palette.locator('button').count();
  console.log(`Initial palette buttons: ${initialButtonCount}`);
  
  // Take screenshot before clicking
  await page.screenshot({ path: 'test-results/before-click.png', fullPage: true });
  
  // Click on the second color button (index 1)
  const secondColorButton = palette.locator('button').nth(1);
  await secondColorButton.click();
  await page.waitForTimeout(500);
  
  // Click on the third color button (index 2)
  const thirdColorButton = palette.locator('button').nth(2);
  await thirdColorButton.click();
  await page.waitForTimeout(500);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'test-results/after-clicks.png', fullPage: true });
  
  // Count palette buttons again
  const finalButtonCount = await palette.locator('button').count();
  console.log(`Final palette buttons: ${finalButtonCount}`);
  
  // Verify palette was not duplicated - button count should be the same
  expect(finalButtonCount).toBe(initialButtonCount);
  
  // Verify there's only one palette element
  const paletteCount = await page.locator('.palette').count();
  expect(paletteCount).toBe(1);
  
  console.log('✓ Palette duplication bug is fixed!');
});
