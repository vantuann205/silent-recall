export const messages = {
  UNAUTHORIZED: 'Manufacturer authorization is required.',
  DUPLICATE: 'This record is already registered.',
  UNREGISTERED: 'This credential is not registered.',
  MANUFACTURER: 'The manufacturer does not match.',
  MODEL: 'The product model does not match.',
  BATCH: 'The product batch does not match.',
  WARRANTY: 'This recall requires warranty eligibility.',
  PURCHASE: 'The purchase date is outside the recall range.',
  CLOSED: 'This recall campaign is closed.',
  EXPIRED: 'This recall campaign has expired.',
  SCHEDULED: 'This recall campaign has not opened.',
  NOT_FOUND: 'Campaign not found.',
  DISCONNECTED: 'Connect your wallet to continue.',
  UNAVAILABLE:
    'Network or proof service is unavailable. Retry when the connection returns.',
  INVALID: 'The submitted data is invalid.',
  UNKNOWN:
    'The operation failed. Check the wallet request and contract configuration before retrying.',
} as const;
export type ErrorCode = keyof typeof messages;
export class RecallError extends Error {
  constructor(readonly code: ErrorCode) {
    super(messages[code]);
  }
}
export function safeError(error: unknown) {
  if (error instanceof RecallError) return error.message;
  const text = error instanceof Error ? error.message : '';
  for (const code of Object.keys(messages) as ErrorCode[])
    if (text.includes(`SR_${code}`)) return messages[code];
  return messages.UNKNOWN;
}
