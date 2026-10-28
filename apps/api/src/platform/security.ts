import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHmac,
} from 'node:crypto';
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64, {
    N: 32768,
    maxmem: 64 * 1024 * 1024,
  });
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function encryptionKey() {
  const value = process.env.PLATFORM_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error(
      'PLATFORM_ENCRYPTION_KEY deve contenere 64 caratteri esadecimali',
    );
  return Buffer.from(value, 'hex');
}
export function encrypt(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), body]
    .map((b) => b.toString('base64url'))
    .join('.');
}
export function decrypt(value: string) {
  const [iv, tag, body] = value
    .split('.')
    .map((v) => Buffer.from(v, 'base64url'));
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString('utf8');
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newTotpSecret() {
  return Array.from(randomBytes(32), (b) => alphabet[b & 31]).join('');
}
export function totp(secret: string, step: number) {
  let bits = '';
  for (const c of secret)
    bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(
    Array.from(bits.match(/.{8}/g) || [], (b: string) => parseInt(b, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', key).update(counter).digest(),
    o = h[19] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, '0');
}
export function verifyTotp(
  secret: string,
  code: string,
  lastStep = 0n,
  now = Date.now(),
) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const step of [current - 1, current, current + 1]) {
    if (
      BigInt(step) > lastStep &&
      timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code))
    )
      return BigInt(step);
  }
  return null;
}
