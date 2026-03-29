import { test, expect } from '@playwright/test';

test.describe('Editor View Investigation', () => {
  test('Check Editor View for errors', async ({ page }) => {
    const errors: string[] = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      const location = msg.location();
      const locationInfo = location?.url ? ` (${location.url}:${location.lineNumber || '?'})` : '';
      
      console.log(`[${type}] ${text}${locationInfo}`);
      
      if (type === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const msg = `Page error: ${error.message}`;
      console.log(`[PAGE ERROR] ${msg}`);
      errors.push(msg);
    });

    // Navigate to the page
    console.log('Loading home page...');
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click on the Simple Heart puzzle card
    console.log('Clicking on Simple Heart puzzle...');
    const puzzleCard = page.locator('.puzzle-card:has-text("Simple Heart")');
    await puzzleCard.click();
    
    // Wait for editor to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of editor
    await page.screenshot({ path: 'test-results/editor-screenshot.png', fullPage: true });
    
    // Check if there are editor elements
    const hasCanvas = await page.locator('canvas').count() > 0;
    const hasEditorView = await page.locator('#editor-view').count() > 0;
    const pageContent = await page.locator('body').innerHTML();
    
    console.log('\n=== EDITOR VIEW CHECK ===');
    console.log(`Canvas found: ${hasCanvas}`);
    console.log(`Editor view found: ${hasEditorView}`);
    console.log(`Total errors found: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => console.log(`  ✗ ${err}`));
    }
    
    // Log page content excerpt
    console.log('\n=== PAGE HTML EXCERPT ===');
    console.log(pageContent.substring(0, 1000));
  });
});
