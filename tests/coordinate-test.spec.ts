import { test, expect } from '@playwright/test';

test('Test coordinate conversion directly', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(msg.text());
  });

  // Navigate to the test page
  await page.goto('http://localhost:8081/test-coordinates.html');
  await page.waitForTimeout(2000);

  // Click the test button
  await page.click('button:has-text("Test Click at Canvas Center")');
  await page.waitForTimeout(1000);

  // Also try clicking directly on the canvas
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Click near the top-left where the heart is
    await page.mouse.click(box.x + 50, box.y + 50);
    await page.waitForTimeout(500);
  }

  // Print all logs
  console.log('\n=== Test Logs ===');
  logs.forEach(log => console.log(log));
  console.log('=================\n');

  // Check for specific messages
  const hasPaintAtLog = logs.some(log => log.includes('paintAt called'));
  const hasSuccessLog = logs.some(log => log.includes('Painting successful'));

  console.log('paintAt was called:', hasPaintAtLog);
  console.log('Painting was successful:', hasSuccessLog);
});
