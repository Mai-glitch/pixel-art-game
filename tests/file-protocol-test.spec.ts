import { test, expect } from '@playwright/test';

test.describe('File Protocol Investigation', () => {
  test('Check console errors when opening via file:// protocol', async ({ page }) => {
    const errors: string[] = [];
    const pageErrors: string[] = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      const location = msg.location();
      const locationInfo = location?.url ? ` (${location.url}:${location.lineNumber || '?'})` : '';
      
      const fullMsg = `[${type}] ${text}${locationInfo}`;
      console.log(fullMsg);
      
      if (type === 'error') {
        errors.push(fullMsg);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const msg = `Page error: ${error.message}`;
      console.log(msg);
      pageErrors.push(msg);
    });

    // Navigate using file:// protocol
    const filePath = 'file:///Users/mickaelross/devX/test-supapowa/.worktrees/pixel-art-game/index.html';
    console.log(`\nLoading via file protocol: ${filePath}`);
    
    await page.goto(filePath);
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/file-protocol-screenshot.png', fullPage: true });
    
    // Get page content
    const appHtml = await page.locator('#app').innerHTML().catch(() => 'App div is empty');
    
    console.log('\n===========================================');
    console.log('RESULTS FROM FILE:// PROTOCOL:');
    console.log('===========================================');
    console.log(`Console errors: ${errors.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    
    if (errors.length > 0) {
      console.log('\nConsole Errors:');
      errors.forEach(err => console.log(`  ✗ ${err}`));
    }
    
    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(err => console.log(`  ✗ ${err}`));
    }
    
    console.log('\nApp div content:');
    console.log(appHtml.substring(0, 200));
    console.log('===========================================\n');
  });
});
