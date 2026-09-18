import { createHash } from 'node:crypto';

const CENTS_PER_UNIT = 100;
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

function containsInvalidIdempotencyCharacter(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127;
  });
}

export type MoneyLine = {
  price: number;
  quantity: number;
};

export function toCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError('Importo monetario non valido');
  }

  return Math.round((value + Number.EPSILON) * CENTS_PER_UNIT);
}

export function fromCents(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('Valore in centesimi non valido');
  }

  return value / CENTS_PER_UNIT;
}

export function normalizeMoney(value: number): number {
  return fromCents(toCents(value));
}

export function sumMoneyLines(lines: MoneyLine[]): number {
  const cents = lines.reduce(
    (total, line) => total + toCents(line.price) * line.quantity,
    0,
  );

  return fromCents(cents);
}

export function normalizeIdempotencyKey(value?: string): string | undefined {
  if (value === undefined) return undefined;

  const key = value.trim();
  if (!key) return undefined;

  if (
    key.length > IDEMPOTENCY_KEY_MAX_LENGTH ||
    containsInvalidIdempotencyCharacter(key)
  ) {
    throw new RangeError('Idempotency-Key non valida');
  }

  return key;
}

export function requestFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
