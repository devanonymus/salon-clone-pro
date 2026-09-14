import { randomUUID } from 'node:crypto';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function normalizeRequestId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const requestId = value.trim();
  return REQUEST_ID_PATTERN.test(requestId) ? requestId : undefined;
}

export function getOrCreateRequestId(value: unknown): string {
  return normalizeRequestId(value) ?? randomUUID();
}
