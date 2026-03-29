import { test, expect } from '@playwright/test';

test.describe('Test', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
  });
});
