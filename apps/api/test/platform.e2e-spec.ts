import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { hashPassword, encrypt, totp } from '../src/platform/security';
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const actor = {
  id: 'admin',
  name: 'Admin',
  email: 'admin@example.test',
  role: 'SUPER_ADMIN',
  active: true,
};
const cookies = 'salonpro_platform=opaque-session';
describe('Platform HTTP boundaries', () => {
  let app: INestApplication;
  const db = {
    platformSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    platformAdmin: { findUnique: jest.fn(), updateMany: jest.fn() },
    platformAuditLog: { create: jest.fn() },
    tenant: { findMany: jest.fn(), findUnique: jest.fn() },
    technicianAssignment: { findUnique: jest.fn() },
    platformConfiguration: { findMany: jest.fn(), findUnique: jest.fn() },
    platformDevice: { findMany: jest.fn(), findFirst: jest.fn() },
    salonOnboarding: { findMany: jest.fn() },
    technicalIntervention: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.PLATFORM_ENCRYPTION_KEY = 'c'.repeat(64);
    process.env.PLATFORM_WEB_URL = 'http://localhost:3000';
    db.platformSession.findUnique.mockImplementation(({ where }) =>
      where.tokenHash
        ? Promise.resolve({
            id: 'session',
            admin: actor,
            expiresAt: new Date(Date.now() + 60000),
          })
        : Promise.resolve(null),
    );
    db.platformAdmin.findUnique.mockResolvedValue({
      ...actor,
      passwordHash: hashPassword('admin-password'),
      totpEncrypted: encrypt(secret),
      lastTotpStep: 0n,
      failedAttempts: 0,
    });
    db.platformAdmin.updateMany.mockResolvedValue({ count: 1 });
    db.$transaction.mockImplementation((fn) => fn(db));
    db.platformDevice.findMany.mockResolvedValue([]);
    db.platformDevice.findFirst.mockResolvedValue(null);
    db.platformConfiguration.findUnique.mockResolvedValue(null);
    db.tenant.findMany.mockResolvedValue([]);
    db.tenant.findUnique.mockResolvedValue({ id: 'salon' });
    db.technicianAssignment.findUnique.mockResolvedValue(null);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  it('requires an independent platform session even when a salon bearer is supplied', async () => {
    await request(app.getHttpServer())
      .get('/platform/salons')
      .set('Authorization', 'Bearer salon-token')
      .expect(401);
  });
  it('returns scoped salon data with no-store', async () => {
    const response = await request(app.getHttpServer())
      .get('/platform/salons')
      .set('Cookie', cookies)
      .expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual([]);
  });
  it('sets an HttpOnly session cookie without returning a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/platform/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({
        email: actor.email,
        password: 'admin-password',
        totp: totp(secret, Math.floor(Date.now() / 30000)),
      })
      .expect(201);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
    expect(response.body).toEqual({ ok: true });
  });
  it('rejects cross-origin writes', async () => {
    await request(app.getHttpServer())
      .post('/platform/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: actor.email, password: 'password', totp: '123456' })
      .expect(403);
  });
  it('rejects malformed login DTOs', async () => {
    await request(app.getHttpServer())
      .post('/platform/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'not-an-email', password: 'password', totp: '123' })
      .expect(400);
  });
  it('rejects malformed provisioning before reaching persistence', async () => {
    await request(app.getHttpServer())
      .post('/platform/salons')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({ name: 'Bad salon' })
      .expect(400);
  });
  it('denies technician access to an unassigned salon', async () => {
    db.platformSession.findUnique.mockResolvedValue({
      id: 'session',
      admin: { ...actor, role: 'TECHNICIAN' },
      expiresAt: new Date(Date.now() + 60000),
    });
    await request(app.getHttpServer())
      .get('/platform/salons/other')
      .set('Cookie', cookies)
      .expect(403);
  });
  it('denies technicians account creation on the server', async () => {
    db.platformSession.findUnique.mockResolvedValue({
      id: 'session',
      admin: { ...actor, role: 'TECHNICIAN' },
      expiresAt: new Date(Date.now() + 60000),
    });
    await request(app.getHttpServer())
      .post('/platform/technicians')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Technician',
        email: 'technician@example.test',
        role: 'TECHNICIAN',
      })
      .expect(403);
  });
  it('clears the cookie and revokes the persisted session at logout', async () => {
    const response = await request(app.getHttpServer())
      .post('/platform/logout')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(201);
    expect(response.headers['set-cookie'][0]).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
    expect(db.platformSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session', adminId: actor.id },
      data: { revokedAt: expect.any(Date) },
    });
  });
  it('reports unsupported device communication honestly', async () => {
    const response = await request(app.getHttpServer())
      .post('/platform/salons/salon/test/pos')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(201);
    expect(response.body).toMatchObject({ supported: false, success: false });
  });
  it('exposes device inventories without leaking credentials', async () => {
    const response = await request(app.getHttpServer())
      .get('/platform/salons/salon/devices/section/pos')
      .set('Cookie', cookies)
      .expect(200);
    expect(response.body).toEqual({ devices: [], legacyAvailable: false });
  });
  it('rejects malformed device configurations at the HTTP boundary', async () => {
    await request(app.getHttpServer())
      .post('/platform/salons/salon/devices/section/pos')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({ label: 'A' })
      .expect(400);
  });
  it('requires an optimistic version when editing a device', async () => {
    await request(app.getHttpServer())
      .put('/platform/salons/salon/devices/foreign')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        label: 'Reception',
        data: {
          provider: 'Provider',
          terminalId: 'T1',
          connection: 'USB',
          mode: 'MANUALE',
        },
      })
      .expect(400);
  });
  it('does not allow device identifiers to bypass tenant scoping', async () => {
    await request(app.getHttpServer())
      .put('/platform/salons/other/devices/foreign')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        label: 'Reception',
        version: 1,
        data: {
          provider: 'Provider',
          terminalId: 'T1',
          connection: 'USB',
          mode: 'MANUALE',
        },
      })
      .expect(404);
  });
  it('denies device inventory access to an unassigned technician', async () => {
    db.platformSession.findUnique.mockResolvedValue({
      id: 'session',
      admin: { ...actor, role: 'TECHNICIAN' },
      expiresAt: new Date(Date.now() + 60000),
    });
    await request(app.getHttpServer())
      .get('/platform/salons/other/devices/section/pos')
      .set('Cookie', cookies)
      .expect(403);
  });
  it('requires a version when archiving and rejects NA as a physical-device result', async () => {
    await request(app.getHttpServer())
      .post('/platform/salons/salon/devices/foreign/archive')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .post('/platform/salons/salon/devices/foreign/check')
      .set('Cookie', cookies)
      .set('Origin', 'http://localhost:3000')
      .send({ version: 1, result: 'NA', notes: 'Not a valid physical result' })
      .expect(400);
  });
  it('blocks /auth/seed in production even with the demo flag enabled', async () => {
    const old = process.env.NODE_ENV,
      flag = process.env.ALLOW_DEMO_SEED;
    try {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEMO_SEED = 'true';
      await request(app.getHttpServer()).get('/auth/seed').expect(404);
    } finally {
      process.env.NODE_ENV = old;
      process.env.ALLOW_DEMO_SEED = flag;
    }
  });
});
