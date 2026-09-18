import {
  Controller,
  Get,
  Header,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma.service';
import type { RequestWithId } from '../observability/request-id.middleware';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  live(@Req() request: RequestWithId) {
    return {
      status: 'up',
      service: 'salon-pro-api',
      version:
        process.env.APP_VERSION || process.env.npm_package_version || 'dev',
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
      requestId: request.requestId,
    };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready(@Req() request: RequestWithId) {
    try {
      await this.prisma.$queryRaw`SELECT 1 AS "ok"`;

      return {
        status: 'ready',
        checks: { database: 'up' },
        checkedAt: new Date().toISOString(),
        requestId: request.requestId,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: { database: 'down' },
        checkedAt: new Date().toISOString(),
        requestId: request.requestId,
      });
    }
  }
}
