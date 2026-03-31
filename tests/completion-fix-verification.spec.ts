import { test, expect } from '@playwright/test';

test('verify completion fix - no premature celebration', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click first puzzle card
  const puzzleCards = await page.locator('.puzzle-card, [class*="PuzzleCard"]').all();
  expect(puzzleCards.length).toBeGreaterThan(0);
  await puzzleCards[0].click();
  await page.waitForTimeout(1500);

  // Verify we're in editor
  const backButton = page.locator('button:has-text("Retour")');
  await expect(backButton).toBeVisible();

  // Select color 1
  const paletteButtons = await page.locator('.palette button').all();
  await paletteButtons[0].click();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const cellDisplaySize = box.width / 32;

  // Paint a few cells (far from completion)
  for (let i = 0; i < 5; i++) {
    const x = box.x + (cellDisplaySize * (i + 2));
    const y = box.y + (cellDisplaySize * 2);
    await page.mouse.click(x, y);
  }

  await page.waitForTimeout(500);

  // Verify NO celebration appeared
  const celebration = await page.locator('text=Bravo, vous avez terminé !').count();
  expect(celebration).toBe(0);

  // Verify progress is shown
  const progressText = await page.locator('header span:text-matches("[0-9]+%")').textContent();
  expect(progressText).toBeTruthy();
  console.log('Progress:', progressText);

  await page.screenshot({ path: 'completion-fix-verification.png', fullPage: true });
});

test('verify no multiple celebrations', async ({ page }) => {
  // Set up a puzzle with near-complete state via localStorage
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Get puzzle info
  const puzzleInfo = await page.evaluate(() => {
    const puzzles = JSON.parse(localStorage.getItem('pixelart_puzzles') || '[]');
    return puzzles[0];
  });

  const totalPixels = puzzleInfo.targetGrid.flat().filter((v: number) => v > 0).length;
  
  // Set up painted grid with all but one pixel painted
  const paintedGrid = Array(32).fill(null).map(() => Array(32).fill(0));
  let paintedCount = 0;
  
  for (let y = 0; y < 32 && paintedCount < totalPixels - 1; y++) {
    for (let x = 0; x < 32 && paintedCount < totalPixels - 1; x++) {
      if (puzzleInfo.targetGrid[y][x] > 0) {
        paintedGrid[y][x] = 1;
        paintedCount++;
      }
    }
  }

  // Save to localStorage
  await page.evaluate((paintedGridData) => {
    const puzzles = JSON.parse(localStorage.getItem('pixelart_puzzles') || '[]');
    puzzles[0].paintedGrid = paintedGridData;
    localStorage.setItem('pixelart_puzzles', JSON.stringify(puzzles));
  }, paintedGrid);

  // Reload page
  await page.reload();
  await page.waitForTimeout(1500);

  // Click first puzzle again
  const puzzleCards = await page.locator('.puzzle-card, [class*="PuzzleCard"]').all();
  await puzzleCards[0].click();
  await page.waitForTimeout(1500);

  const backButton = page.locator('button:has-text("Retour")');
  await expect(backButton).toBeVisible();

  // Select color and paint the last pixel
  const paletteButtons = await page.locator('.palette button').all();
  await paletteButtons[0].click();

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) return;

  const cellDisplaySize = box.width / 32;

  // Find and paint the last unpainted pixel
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (puzzleInfo.targetGrid[y][x] > 0 && paintedGrid[y][x] === 0) {
        const clickX = box.x + (cellDisplaySize * (x + 0.5));
        const clickY = box.y + (cellDisplaySize * (y + 0.5));
        await page.mouse.click(clickX, clickY);
        break;
      }
    }
  }

  await page.waitForTimeout(1000);

  // Verify celebration appeared (all pixels painted)
  const celebration = await page.locator('text=Bravo, vous avez terminé !').count();
  expect(celebration).toBeGreaterThan(0);
  console.log('✓ Celebration appeared on 100% completion');

  // Paint a few more times (should NOT trigger more celebrations)
  for (let i = 0; i < 3; i++) {
    const clickX = box.x + (cellDisplaySize * (i + 2));
    const clickY = box.y + (cellDisplaySize * (i + 2));
    await page.mouse.click(clickX, clickY);
  }

  await page.waitForTimeout(1000);

  // Count celebration popups - should still be 1
  const celebrationCount = await page.locator('text=Bravo, vous avez terminé !').count();
  expect(celebrationCount).toBe(1);
  console.log('✓ No duplicate celebrations (hasCelebrated flag works)');

  await page.screenshot({ path: 'no-duplicate-celebration.png', fullPage: true });
});
