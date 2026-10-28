import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PlatformService, type Actor } from './platform.service';
export type PlatformRequest = Request & {
  actor: Actor;
  platformSessionId: string;
};
export function checkOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const expected = process.env.PLATFORM_WEB_URL;
  if (!expected || req.headers.origin !== new URL(expected).origin)
    throw new ForbiddenException('Origine non consentita');
  if (!req.is('application/json'))
    throw new ForbiddenException('JSON richiesto');
}
@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(private readonly platform: PlatformService) {}
  async canActivate(context: ExecutionContext) {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Cache-Control', 'no-store');
    const req = context.switchToHttp().getRequest<PlatformRequest>();
    checkOrigin(req);
    const match = req.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('salonpro_platform='));
    const session = await this.platform.session(
      match?.slice('salonpro_platform='.length),
    );
    req.actor = session.actor;
    req.platformSessionId = session.sessionId;
    return true;
  }
}
