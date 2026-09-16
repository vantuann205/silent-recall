import { test, expect } from '@playwright/test';

test('background follows the mouse, settles on leave and ignores reduced-motion input', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.home-motion')).toHaveAttribute(
    'data-motion',
    'true',
  );
  const pixels = () =>
    page
      .locator('.flow-background canvas')
      .evaluate((node: HTMLCanvasElement) => node.toDataURL());
  const initial = await pixels();
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width * 0.85, viewport.height * 0.65);
  if (isMobile) expect(await pixels()).toBe(initial);
  else {
    await expect.poll(pixels).not.toBe(initial);
    await page.mouse.move(10, 10);
    await expect.poll(pixels).toBe(initial);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.home-motion')).toHaveAttribute(
    'data-motion',
    'false',
  );
  const reduced = await pixels();
  await page.mouse.move(viewport.width * 0.7, viewport.height * 0.4);
  expect(await pixels()).toBe(reduced);
});

test('scroll changes the background, reveals content and keeps navigation usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const home = page.locator('.home-motion');
  const background = page.locator('.flow-background canvas');
  await expect(home).toHaveAttribute('data-motion', 'true');
  const pixels = () =>
    background.evaluate((node: HTMLCanvasElement) => node.toDataURL());
  const initial = await pixels();
  expect(
    await background.evaluate((node: HTMLCanvasElement) =>
      node
        .getContext('2d')!
        .getImageData(0, 0, node.width, node.height)
        .data.some((value, index) => index % 4 === 3 && value > 0),
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'instant' }));
  await expect.poll(pixels).not.toBe(initial);
  await page.locator('.entry-grid').scrollIntoViewIfNeeded();
  await expect(page.locator('.entry-link').first()).toHaveClass(/is-revealed/);
  await expect(page.locator('.entry-link').first()).toHaveCSS('opacity', '1');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(home).toHaveAttribute('data-motion', 'false');
  const reduced = await pixels();
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
  expect(await pixels()).toBe(reduced);
  await page.locator('.entry-link').first().click();
  await expect(
    page.getByRole('heading', { name: 'Customer workspace' }),
  ).toBeVisible();
  await expect(page.locator('.flow-background')).toHaveCount(0);
});
