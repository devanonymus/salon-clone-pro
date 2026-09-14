import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { AuthRequest } from './auth-request';
import { USER_ROLES, type AuthUser } from './auth-user';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.match(/^Bearer\s+/i)) {
      throw new UnauthorizedException('Token mancante');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET mancante nel runtime Nest');

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER || 'salon-pro-api',
        audience: process.env.JWT_AUDIENCE || 'salon-pro-web',
      });

      if (
        typeof payload === 'string' ||
        typeof payload.userId !== 'string' ||
        typeof payload.tenantId !== 'string' ||
        typeof payload.username !== 'string' ||
        typeof payload.role !== 'string' ||
        !USER_ROLES.includes(payload.role as AuthUser['role'])
      ) {
        throw new Error('Payload token non valido');
      }

      request.user = payload as unknown as AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Token non valido');
    }
  }
}
