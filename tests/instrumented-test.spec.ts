import { test, expect } from '@playwright/test';

test('Instrumented painting test', async ({ page }) => {
  // Collect all console logs
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log('PAGE LOG:', msg.text());
  });

  // Navigate to the application
  await page.goto('/');
  await page.waitForTimeout(1000);

  // Click on "Simple Heart" puzzle
  const simpleHeartCard = page.locator('text=Simple Heart').first();
  await simpleHeartCard.click();
  await page.waitForTimeout(1500);

  // Inject instrumentation
  await page.evaluate(() => {
    // Keep reference to the editor instance
    const editorDiv = document.getElementById('editor-view');
    if (!editorDiv) {
      console.log('ERROR: No editor-view found');
      return;
    }

    // Find the canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.log('ERROR: No canvas found');
      return;
    }

    console.log('Canvas found:', {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight
    });

    // Override addEventListener to capture paintAt calls
    const originalAddEventListener = canvas.addEventListener;
    canvas.addEventListener = function(type: string, handler: any, options?: any) {
      if (type === 'pointerdown') {
        const wrappedHandler = (e: PointerEvent) => {
          console.log('POINTERDOWN event:', {
            clientX: e.clientX,
            clientY: e.clientY,
            button: e.button,
            target: e.target?.constructor?.name
          });
          handler(e);
        };
        return originalAddEventListener.call(this, type, wrappedHandler, options);
      }
      return originalAddEventListener.call(this, type, handler, options);
    };

    console.log('Instrumentation added');
  });

  // Wait a bit for any re-rendering
  await page.waitForTimeout(500);

  // Click on color 1 (white)
  const paletteButtons = await page.locator('.palette button').all();
  if (paletteButtons.length > 0) {
    await paletteButtons[0].click();
    console.log('Selected color 1');
  }

  // Get canvas position and click
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  console.log('Canvas box:', box);

  if (box) {
    // Try different positions - center should be in the heart
    // The heart is at the top-left of the 32x32 grid
    // At default zoom, each cell is displayed at roughly clientWidth/32
    const cellSize = box.width / 32; // The grid is 32x32 cells
    console.log('Estimated cell size:', cellSize);

    // Click at the 3rd row, 3rd column (within the heart)
    // This should be around (2.5 * cellSize, 2.5 * cellSize) from canvas top-left
    const clickX = box.x + (cellSize * 2.5);
    const clickY = box.y + (cellSize * 2.5);

    console.log(`Clicking at canvas coordinates: ${clickX}, ${clickY}`);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);
  }

  // Get progress
  const progress = await page.locator('header span').textContent();
  console.log('Progress after click:', progress);

  // Take screenshot
  await page.screenshot({ path: 'instrumented-test.png', fullPage: true });

  // Print all collected logs
  console.log('\n=== All Page Logs ===');
  logs.forEach(log => console.log(log));
  console.log('=====================\n');
});
