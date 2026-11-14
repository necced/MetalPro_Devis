import { test, expect } from '@playwright/test';

test('debug network requests', async ({ page }, testInfo) => {
  const networkErrors: string[] = [];
  const loadedScripts: string[] = [];

  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${url}`);
    }
    if (
      (url.endsWith('.js') || url.endsWith('.tsx') || url.includes('/src/main')) &&
      response.status() === 200
    ) {
      loadedScripts.push(url);
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      testInfo.attach('console-error', { body: text, contentType: 'text/plain' });
      console.log('Console error:', text);
    } else {
      console.log(`Console ${msg.type()}:`, text);
    }
  });

  page.on('pageerror', (error) => {
    console.log('Page error:', error.message);
    testInfo.attach('page-error', { body: error.message, contentType: 'text/plain' });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(10000);

  testInfo.attach('network-errors', {
    body: JSON.stringify(networkErrors, null, 2),
    contentType: 'application/json',
  });
  testInfo.attach('loaded-scripts', {
    body: JSON.stringify(loadedScripts, null, 2),
    contentType: 'application/json',
  });

  const title = await page.title();
  const bodyText = await page.locator('body').textContent();
  const rootHTML = await page.locator('#root').innerHTML();
  const hasReactRoot = await page.evaluate(
    () => document.querySelector('#root')?.children.length > 0
  );

  // Check computed styles
  const rootStyles = await page.evaluate(() => {
    const root = document.querySelector('#root');
    const body = document.body;
    if (!root) return { root: null, body: null };
    const rootStyle = window.getComputedStyle(root);
    const bodyStyle = window.getComputedStyle(body);
    return {
      root: {
        display: rootStyle.display,
        visibility: rootStyle.visibility,
        opacity: rootStyle.opacity,
        height: rootStyle.height,
        width: rootStyle.width,
        overflow: rootStyle.overflow,
        children: root.children.length,
        innerHTML: root.innerHTML.substring(0, 500),
      },
      body: {
        display: bodyStyle.display,
        visibility: bodyStyle.visibility,
        opacity: bodyStyle.opacity,
        height: bodyStyle.height,
        width: bodyStyle.width,
        margin: bodyStyle.margin,
        padding: bodyStyle.padding,
        innerHTML: body.innerHTML.substring(0, 500),
      },
    };
  });

  testInfo.attach('root-styles', {
    body: JSON.stringify(rootStyles, null, 2),
    contentType: 'application/json',
  });
  console.log('Root styles:', JSON.stringify(rootStyles, null, 2));

  testInfo.attach('title', { body: title, contentType: 'text/plain' });
  testInfo.attach('body-text', { body: bodyText || '', contentType: 'text/plain' });
  testInfo.attach('root-html', { body: rootHTML || '', contentType: 'text/plain' });
  testInfo.attach('has-react-root', { body: String(hasReactRoot), contentType: 'text/plain' });

  console.log('Network errors:', networkErrors);
  console.log('Loaded scripts:', loadedScripts);
  console.log('Title:', title);
  console.log('Body text:', bodyText);
  console.log('Root HTML:', rootHTML);
  console.log('Has React root:', hasReactRoot);
});
