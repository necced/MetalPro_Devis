import { test, expect } from './test-utils';

test('diagnostic - check console errors', async ({ testPage }) => {
  const errors: string[] = [];
  testPage.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  testPage.on('pageerror', (error) => {
    errors.push(error.message);
  });

  await testPage.waitForTimeout(5000);

  console.log('Console errors:', errors);
  console.log('Page title:', await testPage.title());
  console.log('Body text:', await testPage.locator('body').textContent());

  // Try to find any h1
  const h1s = await testPage.locator('h1').allTextContents();
  console.log('All h1:', h1s);
});
