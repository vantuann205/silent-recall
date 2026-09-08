// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RecallProvider, useRecall } from './recall-provider';
import { DEMO_AUTHORITY } from '@/lib/midnight/demo-gateway';
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
function Probe() {
  const r = useRecall();
  return (
    <>
      <span>{r.status}</span>
      <span>{r.authorized ? 'authorized' : 'locked'}</span>
      <span>{r.data.manufacturerId}</span>
      <span>{r.error}</span>
      <button onClick={() => void r.startDemo()}>Demo</button>
      <button onClick={() => void r.authorize(DEMO_AUTHORITY)}>
        Authorize
      </button>
      <button onClick={() => void r.disconnect()}>Disconnect</button>
      <button onClick={() => void r.connect()}>Connect</button>
      <button onClick={() => r.notify('Saved')}>Notify</button>
    </>
  );
}
it('runs a memory-only demo session with authorization, notices and reconnect', async () => {
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO', 'true');
  render(
    <RecallProvider>
      <Probe />
    </RecallProvider>,
  );
  fireEvent.click(screen.getByText('Demo'));
  await screen.findByText('ACME');
  fireEvent.click(screen.getByText('Authorize'));
  await screen.findByText('authorized');
  fireEvent.click(screen.getByText('Notify'));
  expect(screen.getByRole('status')).toHaveTextContent('Saved');
  fireEvent.click(screen.getByText('Disconnect'));
  await waitFor(() => expect(screen.getByText('disconnected')).toBeVisible());
  expect(screen.getByText('locked')).toBeVisible();
  fireEvent.click(screen.getByText('Connect'));
  await screen.findByText('connected');
});
it('reports missing wallet and guards the context boundary', async () => {
  vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO', 'false');
  render(
    <RecallProvider>
      <Probe />
    </RecallProvider>,
  );
  fireEvent.click(screen.getByText('Demo'));
  expect(screen.getByText('disconnected')).toBeVisible();
  fireEvent.click(screen.getByText('Connect'));
  await screen.findByText('missing');
  expect(screen.getByText(/Lace wallet was not found/)).toBeVisible();
  cleanup();
  expect(() => render(<Probe />)).toThrow('Recall provider is missing');
});
