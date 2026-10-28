import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('Salon login security', () => {
  const hash = bcrypt.hashSync('12345678', 12);
  let db: {
    tenant: { findUnique: jest.Mock };
    salonProfile: { findUnique: jest.Mock };
    user: { findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: AuthService;
  const previousSecret = process.env.JWT_SECRET;
  const user = {
    id: 'owner-a',
    tenantId: 'a',
    username: 'owner',
    role: 'OWNER',
    pinHash: hash,
    authVersion: 2,
    loginFailedAttempts: 0,
    loginLockedUntil: null,
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-only-secret-at-least-32-characters-long';
    db = {
      tenant: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'a', code: 'A', name: 'A' }),
      },
      salonProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({ loginFailedAttempts: 5 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((action: (tx: unknown) => unknown) =>
        Promise.resolve(action(db)),
      ),
    };
    service = new AuthService(db as unknown as PrismaService);
  });
  afterAll(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  it('locks the account using persistent state after repeated failures', async () => {
    await expect(service.login('A', 'owner', 'wrong-pin')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { loginFailedAttempts: { increment: 1 } },
      }),
    );
    const calls = db.user.update.mock.calls as Array<
      [{ data: { loginLockedUntil?: Date } }]
    >;
    expect(
      calls.some(([args]) => args.data.loginLockedUntil instanceof Date),
    ).toBe(true);
  });

  it('rejects even a correct PIN while the account is locked', async () => {
    db.user.findFirst.mockResolvedValue({
      ...user,
      loginLockedUntil: new Date(Date.now() + 60_000),
    });
    await expect(service.login('A', 'owner', '12345678')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it('includes the credential version in new tokens and resets attempts', async () => {
    const result = await service.login('A', 'owner', '12345678');
    expect(jwt.decode(result.token)).toEqual(
      expect.objectContaining({ authVersion: 2, tenantId: 'a' }),
    );
    const args = db.user.updateMany.mock.calls[0] as [
      {
        where: { id: string; authVersion: number };
        data: { loginFailedAttempts: number; loginLockedUntil: null };
      },
    ];
    expect(args[0].where.id).toBe(user.id);
    expect(args[0].where.authVersion).toBe(2);
    expect(args[0].data).toEqual({
      loginFailedAttempts: 0,
      loginLockedUntil: null,
    });
  });

  it('rejects a PIN changed concurrently before token issuance', async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.login('A', 'owner', '12345678')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('gives a generic error for unknown accounts', async () => {
    db.user.findFirst.mockResolvedValue(null);
    await expect(service.login('A', 'missing', '12345678')).rejects.toThrow(
      'Credenziali non valide',
    );
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
