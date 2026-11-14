import { test, expect } from '@playwright/test';

test('debug JS execution errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(10000);

  testInfo.attach('console-errors', {
    body: JSON.stringify(errors, null, 2),
    contentType: 'application/json',
  });
  testInfo.attach('page-errors', {
    body: JSON.stringify(pageErrors, null, 2),
    contentType: 'application/json',
  });

  console.log('Console errors:', errors);
  console.log('Page errors:', pageErrors);

  // Check if React and ReactDOM are available in module scope via import
  const hasReact = await page.evaluate(() => {
    try {
      // Check if we can import React
      return true;
    } catch {
      return false;
    }
  });

  // Check root content
  const rootHTML = await page.locator('#root').innerHTML();
  console.log('Root HTML:', rootHTML);

  // Check if the main module script has loaded and executed
  const moduleLoaded = await page.evaluate(() => {
    // Check if any script tags have loaded
    const scripts = document.querySelectorAll('script[type="module"]');
    return Array.from(scripts).map((s) => s.src);
  });
  console.log('Module scripts:', moduleLoaded);

  // Check the actual main module content
  const mainContent = await page.evaluate(() => {
    // Try to see if the main module code is in the page
    return document.body.innerHTML;
  });
  console.log('Body HTML length:', mainContent.length);
});
