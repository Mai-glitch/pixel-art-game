import { test, expect } from '@playwright/test';

test('Take screenshot of test page', async ({ page }) => {
  // Navigate to the test page
  await page.goto('http://localhost:8081/test-coordinates.html');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'test-page-screenshot.png', fullPage: true });

  // Get page content
  const content = await page.content();
  console.log('Page content length:', content.length);

  // Try to find the app div
  const appDiv = await page.locator('#app').first();
  console.log('App div found:', await appDiv.isVisible().catch(() => false));
  console.log('App div HTML:', await appDiv.innerHTML().catch(e => e.message));

  // Check console for errors
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.waitForTimeout(2000);

  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));
  console.log('===================\n');
});
