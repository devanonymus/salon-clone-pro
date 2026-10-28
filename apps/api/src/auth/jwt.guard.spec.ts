import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  const prisma = {
    salonProfile: { findUnique: jest.fn().mockResolvedValue(null) },
    user: {
      findFirst: jest.fn().mockResolvedValue({
        role: 'OWNER',
        username: 'admin',
        authVersion: 0,
      }),
    },
  } as unknown as PrismaService;
  const previousSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = previousSecret;
  });

  function context(authorization?: string) {
    const request = { headers: { authorization } };
    return {
      request,
      executionContext: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext,
    };
  }

  it('rejects requests without a bearer token', async () => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
    const { executionContext } = context();

    await expect(
      new JwtGuard(prisma).canActivate(executionContext),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a signed token with the expected claims', async () => {
    const secret = 'test-secret-at-least-32-characters-long';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign(
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'OWNER',
        username: 'admin',
      },
      secret,
      {
        issuer: 'salon-pro-api',
        audience: 'salon-pro-web',
        algorithm: 'HS256',
      },
    );
    const { request, executionContext } = context(`Bearer ${token}`);

    await expect(
      new JwtGuard(prisma).canActivate(executionContext),
    ).resolves.toBe(true);
    expect(request).toHaveProperty('user.tenantId', 'tenant-1');
  });

  it('rejects a previously valid token after PIN rotation', async () => {
    const secret = 'test-secret-at-least-32-characters-long';
    process.env.JWT_SECRET = secret;
    const token = jwt.sign(
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'OWNER',
        username: 'admin',
        authVersion: 0,
      },
      secret,
      { issuer: 'salon-pro-api', audience: 'salon-pro-web' },
    );
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
      role: 'OWNER',
      username: 'admin',
      authVersion: 1,
    });
    await expect(
      new JwtGuard(prisma).canActivate(
        context('Bearer ' + token).executionContext,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
