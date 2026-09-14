import { getOrCreateRequestId, normalizeRequestId } from './request-id';

describe('request id helpers', () => {
  it('accepts safe caller-provided identifiers', () => {
    expect(normalizeRequestId(' deploy:123.attempt-2 ')).toBe(
      'deploy:123.attempt-2',
    );
  });

  it('rejects spaces, control characters and oversized identifiers', () => {
    expect(normalizeRequestId('not valid')).toBeUndefined();
    expect(normalizeRequestId('x'.repeat(129))).toBeUndefined();
    expect(normalizeRequestId('trace\nforged')).toBeUndefined();
  });

  it('generates a UUID when the incoming identifier is invalid', () => {
    expect(getOrCreateRequestId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
