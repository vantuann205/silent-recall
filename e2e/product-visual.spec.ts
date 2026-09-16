import { test, expect } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('product scene autoplays even with reduced motion and retains manual controls', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const visual = page.locator('.product-visual');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-paused', 'false');
  await expect(page.locator('.scene-controls')).toHaveCSS(
    'clip-path',
    'inset(50%)',
  );
  const action = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    await button.click();
  };
  const canvas = visual.locator('canvas');
  const before = await canvas.screenshot();
  const brightPixels = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.width;
    probe.height = image.height;
    const context = probe.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] > 100 && pixels[i + 1] > 100 && pixels[i + 2] > 100)
        count++;
    return count;
  }, before.toString('base64'));
  expect(brightPixels).toBeGreaterThan(1000);
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false);
  await action('Pause animation');
  const still = await canvas.screenshot();
  expect((await canvas.screenshot()).equals(still)).toBe(true);
  await action('Reset product view');
  const reset = await canvas.screenshot();
  await action('Rotate right');
  expect((await canvas.screenshot()).equals(reset)).toBe(false);
  await action('Zoom in');
  const zoomed = await canvas.screenshot();
  await action('Zoom out');
  expect((await canvas.screenshot()).equals(zoomed)).toBe(false);
  const zone = (await page.locator('.scene-interaction').boundingBox())!;
  await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2);
  const beforeDrag = await canvas.screenshot();
  await page.mouse.down();
  await page.mouse.move(
    zone.x + zone.width / 2 + 60,
    zone.y + zone.height / 2 + 30,
    { steps: 8 },
  );
  await page.mouse.up();
  expect((await canvas.screenshot()).equals(beforeDrag)).toBe(false);
  await action('Reset product view');
  await action('Play animation');
  await expect(visual).toHaveAttribute('data-paused', 'false');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(visual).toHaveAttribute('data-paused', 'false');
  const resumed = await canvas.screenshot();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(resumed))
    .toBe(false);
  await page.getByRole('link', { name: 'Overview', exact: true }).focus();
  await expect(page.locator('.scene-controls')).toHaveCSS(
    'clip-path',
    'inset(50%)',
  );
  await page.screenshot({
    path: join(tmpdir(), `silentrecall-${info.project.name}.png`),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('product image remains available without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith('webgl')) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.product-fallback')).toBeVisible();
  await expect(page.locator('.product-fallback')).toHaveCSS('opacity', '1');
  await expect(
    page.getByRole('link', { name: 'Check a recall', exact: true }),
  ).toBeVisible();
});
