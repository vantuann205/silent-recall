import { chromium, expect } from '@playwright/test';
import { startDemo, issue, createCampaign } from '../e2e/helpers';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    baseURL: 'http://127.0.0.1:3217',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const capture = async (name: string) => {
    await expect(page.locator('.toast')).toBeHidden();
    await page.screenshot({ path: `docs/assets/${name}.png`, fullPage: true });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  };
  await page.goto('/');
  await expect(page.locator('.hero img')).toBeVisible();
  await capture('overview-desktop');
  await page.goto('/manufacturer');
  await expect(page.getByText('No recall campaigns yet')).toBeVisible();
  await capture('manufacturer-empty');
  await startDemo(page);
  const buffer = await issue(page);
  await createCampaign(page);
  await page
    .getByRole('link', { name: 'Manufacturer', exact: true })
    .first()
    .click();
  await capture('manufacturer-desktop');
  await page.getByRole('link', { name: 'Customer', exact: true }).click();
  await page.getByLabel('Import credential JSON').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Invalid credential' }),
  ).toBeVisible();
  await capture('validation-error');
  // Hold the real File.text promise to inspect the app's import loading state.
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = async function () {
      await new Promise<void>((resolve) => {
        (window as unknown as { releaseRead: () => void }).releaseRead =
          resolve;
      });
      File.prototype.text = original;
      return original.call(this);
    };
  });
  await page
    .getByLabel('Import credential JSON')
    .setInputFiles({ name: 'demo.json', mimeType: 'application/json', buffer });
  await expect(page.getByText('Validating locally...')).toBeVisible();
  await capture('loading');
  await page.evaluate(() =>
    (window as unknown as { releaseRead: () => void }).releaseRead(),
  );
  await expect(page.getByText('Credential v1 / imported')).toBeVisible();
  await page.getByRole('link', { name: 'Check Kettle safety recall' }).click();
  await page
    .getByRole('button', { name: 'Verify eligibility', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Eligible for this recall' }),
  ).toBeVisible();
  await capture('eligible-desktop');
  await page.setViewportSize({ width: 768, height: 1024 });
  await capture('eligible-tablet');
  await page.setViewportSize({ width: 393, height: 852 });
  await capture('eligible-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Forget credential' }).click();
  const invalid = JSON.parse(buffer.toString());
  invalid.batchId = 'OTHER-BATCH';
  await page.getByLabel('Import credential JSON').setInputFiles({
    name: 'wrong.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await page
    .getByRole('button', { name: 'Verify eligibility', exact: true })
    .click();
  await expect(
    page.getByText('The product batch does not match.'),
  ).toBeVisible();
  await capture('ineligible');
  console.log(
    'Captured eight real UI states plus desktop overview. No raw credential values rendered.',
  );
} finally {
  await browser.close();
}
