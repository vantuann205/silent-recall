import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startDemo, issue, createCampaign, customer } from './helpers';

test('motion respects system preference without hiding page content', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/manufacturer');
  await expect(page.locator('main > .wrap')).toHaveCSS(
    'animation-name',
    'enter',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main > .wrap')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(
    page.getByRole('heading', { name: 'Manufacturer workspace' }),
  ).toBeVisible();
  const link = page.getByRole('link', { name: 'Customer', exact: true });
  await link.focus();
  await expect(link).toBeFocused();
  await link.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Customer workspace' }),
  ).toBeVisible();
});
test('landing and wallet missing recovery', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SilentRecall', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Lace wallet' }),
  ).toContainText('Lace wallet was not found');
  await page.getByRole('link', { name: 'Check a recall', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Customer workspace' }),
  ).toBeVisible();
});
test('issue download publish import and verify with privacy boundaries', async ({
  page,
}) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(msg.text()));
  await startDemo(page);
  const buffer = await issue(page);
  const credential = JSON.parse(buffer.toString());
  expect(credential.productSecret).toHaveLength(64);
  await createCampaign(page);
  await customer(page, buffer);
  const details = page.locator('.credential-details');
  await expect(details).not.toHaveAttribute('open');
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.getByText('[private]', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
  await page
    .getByRole('button', { name: 'Verify eligibility', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Eligible for this recall' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Local simulation passed. This is not an on-chain ZK proof.',
    ),
  ).toBeVisible();
  for (const secret of [
    credential.serialNumber,
    credential.productSecret,
    credential.commitmentSalt,
  ]) {
    expect(page.url()).not.toContain(secret);
    expect(await page.locator('body').innerText()).not.toContain(secret);
    expect(logs.join('\n')).not.toContain(secret);
  }
  expect(
    await page.evaluate(() => ({
      local: JSON.stringify(localStorage),
      session: JSON.stringify(sessionStorage),
    })),
  ).toEqual({ local: '{}', session: '{}' });
  await expect(page.locator('body')).not.toHaveJSProperty('scrollWidth', 0);
});
test('wrong batch rejects and can retry', async ({ page }) => {
  await startDemo(page);
  const buffer = await issue(page);
  await createCampaign(page);
  const credential = JSON.parse(buffer.toString());
  credential.batchId = 'OTHER-BATCH';
  await customer(page, Buffer.from(JSON.stringify(credential)));
  await page
    .getByRole('button', { name: 'Verify eligibility', exact: true })
    .click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'The product batch' }),
  ).toContainText('The product batch does not match.');
  await expect(
    page.getByRole('button', { name: 'Retry eligibility check' }),
  ).toBeEnabled();
});
test('closing requires confirmation and prevents checks', async ({ page }) => {
  await startDemo(page);
  const buffer = await issue(page);
  await createCampaign(page);
  await page
    .getByRole('button', { name: 'Close campaign', exact: true })
    .click();
  await page.getByRole('button', { name: 'Keep open' }).click();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Close campaign', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm close' }).click();
  await expect(page.getByText('Closed', { exact: true })).toBeVisible();
  await customer(page, buffer);
  await page
    .getByRole('button', { name: 'Verify eligibility', exact: true })
    .click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'campaign is closed' }),
  ).toContainText('This recall campaign is closed.');
});
test('invalid file and disconnect/reconnect', async ({ page }) => {
  await startDemo(page);
  await page.getByRole('link', { name: 'Customer', exact: true }).click();
  await page.getByLabel('Import credential JSON').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"credentialVersion":99}'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Invalid credential' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Connect wallet' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(
    page.getByRole('button', { name: 'Disconnect', exact: true }),
  ).toBeVisible();
});
test('major pages accessible and fit narrow layouts', async ({ page }) => {
  for (const url of ['/', '/manufacturer', '/customer', '/privacy', '/docs']) {
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/customer');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
