import {
  fromCents,
  normalizeIdempotencyKey,
  normalizeMoney,
  requestFingerprint,
  sumMoneyLines,
  toCents,
} from './money';

describe('money helpers', () => {
  it('normalizes floating point noise to currency precision', () => {
    expect(normalizeMoney(0.1 + 0.2)).toBe(0.3);
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(1999)).toBe(19.99);
  });

  it('sums line totals using integer cents', () => {
    expect(
      sumMoneyLines([
        { price: 0.1, quantity: 3 },
        { price: 0.2, quantity: 1 },
      ]),
    ).toBe(0.5);
  });

  it('normalizes and validates idempotency keys', () => {
    expect(normalizeIdempotencyKey('  checkout-123  ')).toBe('checkout-123');
    expect(normalizeIdempotencyKey('')).toBeUndefined();
    expect(() => normalizeIdempotencyKey('key with spaces')).toThrow(
      'Idempotency-Key non valida',
    );
  });

  it('creates stable request fingerprints', () => {
    const request = { total: 10.5, items: [{ price: 10.5, quantity: 1 }] };
    expect(requestFingerprint(request)).toBe(requestFingerprint(request));
    expect(requestFingerprint(request)).not.toBe(
      requestFingerprint({ ...request, total: 11 }),
    );
  });
});
