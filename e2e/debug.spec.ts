import { test, expect } from '@playwright/test';

test('debug - check console errors and page content', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(10000);

  console.log('Console errors:', errors);
  console.log('Page title:', await page.title());
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));

  // Try to find any h1
  const h1s = await page.locator('h1').allTextContents();
  console.log('All h1:', h1s);

  // Check for React root
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root content (first 500 chars):', rootContent?.substring(0, 500));
});
