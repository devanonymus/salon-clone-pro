import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import * as jwt from 'jsonwebtoken';
  
  @Injectable()
  export class JwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token mancante');
      }
  
      const token = authHeader.replace('Bearer ', '').trim();
  
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        request.user = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Token non valido');
      }
    }
  }