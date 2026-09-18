import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';

describe('App runtime (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const prisma = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health/live propagates a safe request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .set('X-Request-Id', 'e2e-request-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('e2e-request-123');
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'up',
        requestId: 'e2e-request-123',
      }),
    );
  });

  it('/health/ready verifies the database provider', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ready',
        checks: { database: 'up' },
      }),
    );
  });

  it('exposes the protected owner PIN endpoint', () => {
    return request(app.getHttpServer())
      .patch('/auth/me/pin')
      .send({ pin: '1234' })
      .expect(401);
  });

  it('exposes the protected client awards endpoint', () => {
    return request(app.getHttpServer())
      .post('/client-awards')
      .send({})
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
