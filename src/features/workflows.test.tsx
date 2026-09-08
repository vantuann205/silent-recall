// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProductForm } from './manufacturer/product-form';
import { Authorization } from './manufacturer/authorization';
import { CampaignForm } from './campaigns/campaign-form';
import { CampaignDetail } from './campaigns/campaign-detail';
import { CredentialImport } from './credentials/credential-import';
import { ProofFlow } from './eligibility/proof-flow';
import { CampaignList } from './campaigns/campaign-list';
import { createCredential } from '@/lib/validation/credential';
import { RecallError } from '@/lib/midnight/errors';
const mocks = vi.hoisted(() => ({ useRecall: vi.fn(), push: vi.fn() }));
vi.mock('@/providers/recall-provider', () => ({ useRecall: mocks.useRecall }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('campaign=R1'),
}));
const credential = createCredential({
  manufacturerId: 'ACME',
  modelId: 'MODEL',
  batchId: 'BATCH',
  serialNumber: 'PRIVATE-SERIAL',
  purchaseDate: 1,
  warrantyEligible: true,
});
const campaign = {
  id: 'R1',
  title: 'Safety recall',
  manufacturerId: 'ACME',
  modelId: 'MODEL',
  batchId: 'BATCH',
  reason: 'Stop using the product.',
  opensAt: 1,
  expiresAt: 2100000000,
  purchaseFrom: 0,
  purchaseTo: 2000000000,
  warrantyRequired: true,
  voucherValue: 50,
  active: true,
};
function session() {
  return {
    gateway: {
      mode: 'demo',
      register: vi.fn().mockResolvedValue(undefined),
      createCampaign: vi.fn().mockResolvedValue(undefined),
      closeCampaign: vi.fn().mockResolvedValue(undefined),
      prove: vi.fn().mockResolvedValue(undefined),
    },
    data: { manufacturerId: 'ACME', campaigns: [campaign] },
    authorized: true,
    status: 'connected',
    credential: null as typeof credential | null,
    setCredential: vi.fn(),
    authorize: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn(),
    loading: false,
  };
}
let r = session();
beforeEach(() => {
  r = session();
  mocks.useRecall.mockImplementation(() => r);
  mocks.push.mockClear();
});
afterEach(cleanup);
it('renders campaign empty state, public rows and customer links', () => {
  const view = render(<CampaignList campaigns={[]} />);
  expect(screen.getByText('No recall campaigns yet')).toBeInTheDocument();
  view.rerender(<CampaignList campaigns={[campaign]} />);
  expect(
    screen.getByRole('link', { name: 'View Safety recall' }),
  ).toHaveAttribute('href', '/manufacturer/campaigns/R1');
  view.rerender(<CampaignList campaigns={[campaign]} customer />);
  expect(
    screen.getByRole('link', { name: 'Check Safety recall' }),
  ).toHaveAttribute('href', '/customer/check?campaign=R1');
});
it('authorizes demo and reports rejected authority', async () => {
  r.authorized = false;
  r.authorize.mockRejectedValueOnce(new RecallError('UNAUTHORIZED'));
  render(<Authorization />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Authorize local issuer' }),
  );
  await screen.findByRole('alert');
  fireEvent.click(
    screen.getByRole('button', { name: 'Authorize local issuer' }),
  );
  await waitFor(() => expect(r.authorize).toHaveBeenCalledTimes(2));
});
it('issues locally, registers commitment and masks its summary', async () => {
  render(<ProductForm />);
  fireEvent.change(screen.getByLabelText('Model ID'), {
    target: { value: 'MODEL' },
  });
  fireEvent.change(screen.getByLabelText('Batch ID'), {
    target: { value: 'BATCH' },
  });
  fireEvent.change(screen.getByLabelText('Serial number (private)'), {
    target: { value: 'PRIVATE-SERIAL' },
  });
  fireEvent.change(screen.getByLabelText('Purchase date'), {
    target: { value: '2026-01-01' },
  });
  fireEvent.submit(
    screen
      .getByRole('button', { name: 'Generate and register' })
      .closest('form')!,
  );
  await screen.findByText(
    'Commitment registered. Download the private credential now.',
  );
  expect(r.gateway.register).toHaveBeenCalledWith(
    expect.stringMatching(/^[a-f0-9]{64}$/),
  );
  expect(document.body.textContent).not.toContain('PRIVATE-SERIAL');
  fireEvent.click(
    screen.getByRole('button', { name: 'Issue another product' }),
  );
  expect(screen.getByLabelText('Model ID')).toBeInTheDocument();
});
it('rejects missing product fields', async () => {
  render(<ProductForm />);
  fireEvent.submit(
    screen
      .getByRole('button', { name: 'Generate and register' })
      .closest('form')!,
  );
  await screen.findByRole('alert');
  expect(r.gateway.register).not.toHaveBeenCalled();
});
it('validates campaign boundaries before sending', async () => {
  render(<CampaignForm />);
  fireEvent.submit(
    screen.getByRole('button', { name: 'Publish campaign' }).closest('form')!,
  );
  await screen.findByRole('alert');
  expect(r.gateway.createCampaign).not.toHaveBeenCalled();
  for (const [label, value] of [
    ['Campaign ID', 'R1'],
    ['Campaign title', 'Safety recall'],
    ['Model ID', 'MODEL'],
    ['Batch ID', 'BATCH'],
    ['Opens at (local time)', '2020-01-01T00:00'],
    ['Expires at (local time)', '2030-01-01T00:00'],
    ['Purchased on or after', '2020-01-01'],
    ['Purchased on or before', '2029-01-01'],
    ['Safety notice', 'Stop using the product.'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Publish campaign' }).closest('form')!,
  );
  await waitFor(() =>
    expect(mocks.push).toHaveBeenCalledWith('/manufacturer/campaigns/R1'),
  );
});
it('shows loading and missing campaign states', () => {
  r.loading = true;
  const view = render(<CampaignDetail id="missing" />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  r.loading = false;
  view.rerender(<CampaignDetail id="missing" />);
  expect(
    screen.getByRole('heading', { name: 'Campaign not found' }),
  ).toBeInTheDocument();
});
it('requires explicit campaign close confirmation', async () => {
  render(<CampaignDetail id="R1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Close campaign' }));
  expect(r.gateway.closeCampaign).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole('button', { name: 'Confirm close' }));
  await waitFor(() =>
    expect(r.gateway.closeCampaign).toHaveBeenCalledWith('R1'),
  );
});
it('imports only strictly validated bounded JSON', async () => {
  render(<CredentialImport />);
  const input = screen.getByLabelText('Import credential JSON');
  fireEvent.change(input, {
    target: { files: [{ size: 3, text: async () => '{x}' }] },
  });
  await screen.findByRole('alert');
  expect(r.setCredential).toHaveBeenCalledWith(null);
  fireEvent.change(input, {
    target: {
      files: [{ size: 1000, text: async () => JSON.stringify(credential) }],
    },
  });
  await waitFor(() => expect(r.setCredential).toHaveBeenCalledWith(credential));
});
it('masks imported fields and forgets the credential', () => {
  r.credential = credential;
  render(<CredentialImport />);
  expect(document.body.textContent).not.toContain(credential.serialNumber);
  fireEvent.click(screen.getByRole('button', { name: 'Forget credential' }));
  expect(r.setCredential).toHaveBeenCalledWith(null);
});
it('disables proof without a credential or wallet', () => {
  render(<ProofFlow />);
  expect(
    screen.getByRole('button', { name: 'Verify eligibility' }),
  ).toBeDisabled();
});
it('renders proof progress, success and safe retry failure', async () => {
  r.credential = credential;
  let finish!: () => void;
  r.gateway.prove.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<ProofFlow />);
  fireEvent.click(screen.getByRole('button', { name: 'Verify eligibility' }));
  await screen.findByText('Checking compiled contract locally...');
  finish();
  await screen.findByRole('heading', { name: 'Eligible for this recall' });
  r.gateway.prove.mockRejectedValueOnce(new RecallError('BATCH'));
  fireEvent.click(screen.getByRole('button', { name: 'Verify eligibility' }));
  await screen.findByText('The product batch does not match.');
  expect(
    screen.getByRole('button', { name: 'Retry eligibility check' }),
  ).toBeEnabled();
});
it('does not apply a previous proof result to a different credential', async () => {
  r.credential = credential;
  const view = render(<ProofFlow />);
  fireEvent.click(screen.getByRole('button', { name: 'Verify eligibility' }));
  await screen.findByRole('heading', { name: 'Eligible for this recall' });
  r.credential = { ...credential, serialNumber: 'OTHER-PRIVATE-SERIAL' };
  view.rerender(<ProofFlow />);
  expect(
    screen.queryByRole('heading', { name: 'Eligible for this recall' }),
  ).not.toBeInTheDocument();
  r.credential = null;
  view.rerender(<ProofFlow />);
  expect(
    screen.getByRole('button', { name: 'Verify eligibility' }),
  ).toBeDisabled();
});
