import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import type { AuthUser } from '../auth/auth-user';
import type { RequestWithId } from './request-id.middleware';

type ObservedRequest = RequestWithId & { user?: Partial<AuthUser> };

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<ObservedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.write('info', {
          event: 'http_request',
          requestId: request.requestId,
          method: request.method,
          path: this.pathWithoutQuery(request.originalUrl),
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          tenantId: request.user?.tenantId ?? null,
          userId: request.user?.userId ?? null,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : response.statusCode >= 400
              ? response.statusCode
              : 500;

        this.write('error', {
          event: 'http_request_error',
          requestId: request.requestId,
          method: request.method,
          path: this.pathWithoutQuery(request.originalUrl),
          statusCode,
          durationMs: Date.now() - startedAt,
          tenantId: request.user?.tenantId ?? null,
          userId: request.user?.userId ?? null,
          error:
            error instanceof Error
              ? error.constructor.name
              : 'UnknownError',
        });

        return throwError(() => error);
      }),
    );
  }

  private pathWithoutQuery(url: string) {
    return url.split('?', 1)[0] || '/';
  }

  private write(level: 'info' | 'error', event: Record<string, unknown>) {
    const line = JSON.stringify(event);
    if (level === 'error') {
      this.logger.error(line);
      return;
    }

    this.logger.log(line);
  }
}
