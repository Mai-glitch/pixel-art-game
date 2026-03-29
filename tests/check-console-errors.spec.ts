import { test, expect } from '@playwright/test';

test.describe('Console Error Investigation', () => {
  test('Check for console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    const logs: string[] = [];
    const failedRequests: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      const location = msg.location();
      
      const locationInfo = location?.url ? ` (${location.url}:${location.lineNumber || '?'})` : '';
      const message = `[${type}] ${text}${locationInfo}`;
      
      console.log(message);
      
      if (type === 'error') {
        errors.push(text);
      } else {
        logs.push(message);
      }
    });

    // Capture page error events
    page.on('pageerror', (error) => {
      const errorMsg = `Page error: ${error.message}`;
      console.log(`[PAGE ERROR] ${error.message}`);
      errors.push(errorMsg);
    });

    // Track failed network requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      const method = request.method();
      const failure = request.failure();
      const errorText = failure ? failure.errorText : 'Unknown error';
      
      const msg = `${method} ${url} - ${errorText}`;
      console.log(`[REQUEST FAILED] ${msg}`);
      failedRequests.push(msg);
    });

    // Track HTTP responses
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        const status = response.status();
        const msg = `HTTP ${status}: ${url}`;
        console.log(`[HTTP ERROR] ${msg}`);
        failedRequests.push(msg);
      }
    });

    // Navigate to the page
    console.log('Navigating to /\n');
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for modules to load and execute
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/page-screenshot.png', fullPage: true });
    
    // Get page content
    console.log('\n=== PAGE CONTENT ===');
    const appHtml = await page.locator('#app').innerHTML().catch(() => 'App div is empty or not found');
    console.log('App div content:', appHtml.substring(0, 500) + (appHtml.length > 500 ? '...' : ''));
    
    console.log('\n=== CONSOLE LOGS ===');
    console.log(logs.join('\n') || '(No console logs)');
    
    console.log('\n=== CONSOLE ERRORS ===');
    if (errors.length === 0) {
      console.log('(No console errors)');
    } else {
      errors.forEach(err => console.log(`  ✗ ${err}`));
    }
    
    console.log('\n=== FAILED REQUESTS ===');
    if (failedRequests.length === 0) {
      console.log('(No failed requests)');
    } else {
      failedRequests.forEach(req => console.log(`  ✗ ${req}`));
    }
    
    console.log('\n===========================================');
    console.log('SUMMARY:');
    console.log(`  Console errors: ${errors.length}`);
    console.log(`  Failed requests: ${failedRequests.length}`);
    console.log('                                      ===========================================\n');
  });
});
