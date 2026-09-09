import { expect, type Page } from '@playwright/test';
export async function startDemo(page: Page) {
  await page.goto('/manufacturer');
  await page.getByRole('button', { name: 'Start local demo' }).click();
  await page.getByText('Local simulation', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Authorize local issuer' }).click();
  await expect(page.getByText('Manufacturer authorized / ACME')).toBeVisible();
}
export async function issue(page: Page) {
  await page.getByRole('link', { name: 'Issue credential' }).click();
  await page.getByLabel('Model ID', { exact: true }).fill('KETTLE-01');
  await page.getByLabel('Batch ID', { exact: true }).fill('BATCH-2026');
  await page.getByLabel('Serial number (private)').fill('PRIVATE-E2E-12345');
  await page.getByLabel('Purchase date', { exact: true }).fill('2026-01-01');
  await page.getByRole('button', { name: 'Generate and register' }).click();
  await expect(
    page.getByText(
      'Commitment registered. Download the private credential now.',
    ),
  ).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download credential JSON' }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
export async function createCampaign(page: Page) {
  await page
    .getByRole('link', { name: 'Manufacturer', exact: true })
    .first()
    .click();
  await page
    .getByRole('link', { name: 'Create campaign', exact: true })
    .first()
    .click();
  for (const [label, value] of [
    ['Campaign ID', 'RECALL-001'],
    ['Campaign title', 'Kettle safety recall'],
    ['Model ID', 'KETTLE-01'],
    ['Batch ID', 'BATCH-2026'],
    ['Opens at (local time)', '2020-01-01T00:00'],
    ['Expires at (local time)', '2030-01-01T00:00'],
    ['Purchased on or after', '2020-01-01'],
    ['Purchased on or before', '2029-12-31'],
    ['Safety notice', 'Stop using the affected kettle.'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Publish campaign' }).click();
  await expect(
    page.getByRole('heading', { name: 'Kettle safety recall' }),
  ).toBeVisible();
}
export async function customer(page: Page, buffer: Buffer) {
  await page.getByRole('link', { name: 'Customer', exact: true }).click();
  await page.getByLabel('Import credential JSON').setInputFiles({
    name: 'test.credential.json',
    mimeType: 'application/json',
    buffer,
  });
  await page.getByRole('link', { name: 'Check Kettle safety recall' }).click();
  await expect(
    page.getByRole('heading', { name: 'Check recall eligibility' }),
  ).toBeVisible();
}
