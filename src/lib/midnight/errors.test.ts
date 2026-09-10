import { expect, it } from 'vitest';
import { messages, RecallError, safeError } from './errors';
it('maps errors without reflecting secret-bearing provider errors', () => {
  expect(safeError(new Error('private-secret here'))).toBe(messages.UNKNOWN);
  expect(safeError(new Error('failed assert SR_BATCH'))).toBe(messages.BATCH);
  expect(safeError(new RecallError('CLOSED'))).toBe(messages.CLOSED);
  expect(safeError(null)).toBe(messages.UNKNOWN);
  expect(safeError(new RecallError('UNAVAILABLE'))).toBe(messages.UNAVAILABLE);
});
