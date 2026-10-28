import {
  decrypt,
  encrypt,
  hashPassword,
  verifyPassword,
  totp,
  verifyTotp,
  digest,
  newToken,
} from './security';
describe('Platform security', () => {
  beforeEach(() => {
    process.env.PLATFORM_ENCRYPTION_KEY = 'a'.repeat(64);
  });
  it('salts password hashes and rejects incorrect passwords', () => {
    const hash = hashPassword('a-long-password');
    expect(verifyPassword('a-long-password', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
    expect(hashPassword('a-long-password')).not.toBe(hash);
  });
  it('encrypts secrets and authenticates ciphertext', () => {
    const encrypted = encrypt('private-secret');
    expect(encrypted).not.toContain('private-secret');
    expect(decrypt(encrypted)).toBe('private-secret');
    const parts = encrypted.split('.');
    parts[2] = Buffer.from('tampered').toString('base64url');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
  it('matches RFC 6238 SHA-1 vector and rejects replay and expired codes', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(totp(secret, 1)).toBe('287082');
    expect(verifyTotp(secret, '287082', 0n, 59000)).toBe(1n);
    expect(verifyTotp(secret, '287082', 1n, 59000)).toBeNull();
    expect(verifyTotp(secret, '287082', 0n, 300000)).toBeNull();
  });
  it('generates high-entropy tokens with deterministic digests', () => {
    const a = newToken(),
      b = newToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(digest(a)).toHaveLength(64);
  });
});
