import { ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type { RequestWithId } from '../observability/request-id.middleware';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const request = { requestId: 'test-request-id' } as RequestWithId;
  const queryRaw = jest.fn();
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  const controller = new HealthController(prisma);

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports liveness without touching the database', () => {
    expect(controller.live(request)).toEqual(
      expect.objectContaining({
        status: 'up',
        service: 'salon-pro-api',
        requestId: 'test-request-id',
      }),
    );
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness when PostgreSQL responds', async () => {
    queryRaw.mockResolvedValue([{ ok: 1 }]);

    await expect(controller.ready(request)).resolves.toEqual(
      expect.objectContaining({
        status: 'ready',
        checks: { database: 'up' },
        requestId: 'test-request-id',
      }),
    );
  });

  it('returns 503 without exposing the database error', async () => {
    queryRaw.mockRejectedValue(new Error('postgres password leaked'));

    await expect(controller.ready(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    try {
      await controller.ready(request);
    } catch (error) {
      const response = (error as ServiceUnavailableException).getResponse();
      expect(JSON.stringify(response)).not.toContain('password');
    }
  });
});
