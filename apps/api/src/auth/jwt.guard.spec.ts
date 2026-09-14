import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
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

  it('rejects requests without a bearer token', () => {
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
    const { executionContext } = context();

    expect(() => new JwtGuard().canActivate(executionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts a signed token with the expected claims', () => {
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

    expect(new JwtGuard().canActivate(executionContext)).toBe(true);
    expect(request).toHaveProperty('user.tenantId', 'tenant-1');
  });
});
