import { test, expect } from '@playwright/test';

test('initial load and reload wait for the 3D module without a fallback flash', async ({
  page,
}) => {
  let release = () => {};
  let gate = Promise.resolve();
  await page.route('**/*product-scene*.js*', async (route) => {
    await gate;
    await route.continue();
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      if (attempt === 0) await page.goto('/', { waitUntil: 'commit' });
      else await page.reload({ waitUntil: 'commit' });
      await expect(
        page.getByRole('status', { name: 'Loading SilentRecall' }),
      ).toBeVisible();
      await expect(page.locator('.hero-content')).toBeHidden();
      await expect(page.locator('.product-fallback')).toBeHidden();
    } finally {
      release();
    }
    await expect(page.locator('.product-visual')).toHaveAttribute(
      'data-state',
      'ready',
    );
    await expect(page.locator('.home-loader')).toBeHidden();
    await expect(page.locator('.hero-content')).toBeVisible();
    await expect(page.locator('.product-fallback')).toBeHidden();
  }
});

test('a stalled 3D module releases the loading screen into a static page', async ({
  page,
}) => {
  await page.clock.install();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/*product-scene*.js*', async (route) => {
    await gate;
    await route.abort();
  });
  try {
    await page.goto('/');
    await expect(page.locator('.product-visual')).toHaveAttribute(
      'data-state',
      'loading',
    );
    await page.clock.fastForward(9000);
    await expect(page.locator('.product-visual')).toHaveAttribute(
      'data-state',
      'fallback',
    );
    await expect(page.locator('.home-loader')).toBeHidden();
    await expect(page.locator('.hero-content')).toBeVisible();
    await expect(page.locator('.product-fallback')).toBeVisible();
  } finally {
    release();
  }
});
