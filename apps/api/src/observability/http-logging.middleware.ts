import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../auth/auth-user';
import type { RequestWithId } from './request-id.middleware';

type ObservedRequest = RequestWithId & { user?: Partial<AuthUser> };

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const observed = request as ObservedRequest;
    const startedAt = Date.now();
    let completed = false;

    response.once('finish', () => {
      completed = true;
      this.write('info', observed, response.statusCode, Date.now() - startedAt);
    });

    response.once('close', () => {
      if (completed) return;
      this.write('error', observed, 499, Date.now() - startedAt);
    });

    next();
  }

  private write(
    level: 'info' | 'error',
    request: ObservedRequest,
    statusCode: number,
    durationMs: number,
  ) {
    const event = JSON.stringify({
      event: level === 'error' ? 'http_request_aborted' : 'http_request',
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl.split('?', 1)[0] || '/',
      statusCode,
      durationMs,
      tenantId: request.user?.tenantId ?? null,
      userId: request.user?.userId ?? null,
    });

    if (level === 'error') {
      this.logger.error(event);
      return;
    }

    this.logger.log(event);
  }
}
