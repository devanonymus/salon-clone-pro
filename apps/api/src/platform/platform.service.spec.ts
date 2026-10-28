/* Dynamic Prisma doubles deliberately allow arbitrary model return shapes in these boundary tests. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoachService } from '../coach/coach.service';
import { PrismaService } from '../prisma.service';
import {
  PlatformService,
  validateConfiguration,
  type Actor,
  checks,
} from './platform.service';
import { encrypt, hashPassword, totp } from './security';
const admin: Actor = {
  id: 'admin',
  name: 'Admin',
  email: 'admin@example.test',
  role: 'SUPER_ADMIN',
};
const tech: Actor = { ...admin, id: 'tech', role: 'TECHNICIAN' };
function model() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  };
}
describe('Platform authorization and workflows', () => {
  let db: Record<string, any>, service: PlatformService;
  beforeEach(() => {
    process.env.PLATFORM_ENCRYPTION_KEY = 'b'.repeat(64);
    process.env.PLATFORM_WEB_URL = 'http://localhost:3000';
    db = {};
    for (const name of [
      'platformDevice',
      'platformAdmin',
      'platformSession',
      'platformAuditLog',
      'platformInvitation',
      'platformMailOutbox',
      'tenant',
      'user',
      'salonProfile',
      'technicianAssignment',
      'salonOnboarding',
      'platformConfiguration',
      'technicalIntervention',
    ])
      db[name] = model();
    db.$transaction = jest.fn((fn) => fn(db));
    db.tenant.findUnique.mockResolvedValue({ id: 'salon' });
    service = new PlatformService(
      db as unknown as PrismaService,
      { updateSettings: jest.fn() } as unknown as CoachService,
    );
  });
  it('rejects a salon bearer token as a platform session', async () => {
    db.platformSession.findUnique.mockResolvedValue(null);
    await expect(service.session('signed-salon-jwt')).rejects.toThrow(
      UnauthorizedException,
    );
  });
  it('rejects expired and revoked sessions and inactive accounts', async () => {
    for (const value of [
      { expiresAt: new Date(0), admin: { active: true } },
      {
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: new Date(),
        admin: { active: true },
      },
      { expiresAt: new Date(Date.now() + 10000), admin: { active: false } },
    ]) {
      db.platformSession.findUnique.mockResolvedValue(value);
      await expect(service.session('token')).rejects.toThrow(
        UnauthorizedException,
      );
    }
  });
  it.each(['SUPER_ADMIN', 'TECHNICIAN'])(
    'logs in a %s with password and TOTP',
    async (role) => {
      const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
      db.platformAdmin.findUnique.mockResolvedValue({
        ...admin,
        role,
        active: true,
        lastTotpStep: 0n,
        failedAttempts: 0,
        passwordHash: hashPassword('test-password'),
        totpEncrypted: encrypt(secret),
      });
      const token = await service.login({
        email: admin.email,
        password: 'test-password',
        totp: totp(secret, Math.floor(Date.now() / 30000)),
      });
      expect(token.length).toBeGreaterThan(40);
      expect(db.platformSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminId: admin.id,
            tokenHash: expect.not.stringContaining(token),
          }),
        }),
      );
    },
  );
  it('rejects wrong MFA and records a failure', async () => {
    db.platformAdmin.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: admin.email, password: 'wrong', totp: '000000' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(db.platformAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'LOGIN_FAILED' }),
    });
  });
  it('rejects unassigned technicians before reading a tenant', async () => {
    db.technicianAssignment.findUnique.mockResolvedValue(null);
    await expect(service.detail(tech, 'other')).rejects.toThrow(
      ForbiddenException,
    );
    expect(db.tenant.findUnique).not.toHaveBeenCalled();
  });
  it('scopes technician lists on the server', async () => {
    db.tenant.findMany.mockResolvedValue([]);
    await service.list(tech);
    expect(db.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { technicianAssignments: { some: { adminId: tech.id } } },
      }),
    );
  });
  it('prevents technician provisioning and privilege escalation', async () => {
    await expect(
      service.createAdmin(tech, {
        email: 'a@b.test',
        name: 'A',
        role: 'ADMIN',
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createAdmin(
        { ...admin, role: 'ADMIN' },
        { email: 'a@b.test', name: 'A', role: 'SUPER_ADMIN' },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(db.platformAdmin.create).not.toHaveBeenCalled();
  });
  it('creates tenant, inactive owner and encrypted invitation in one transaction', async () => {
    db.tenant.create.mockResolvedValue({ id: 'new' });
    await service.createSalon(admin, {
      name: 'New salon',
      code: 'NEW',
      businessName: 'Salon Ltd',
      vatNumber: '12345678901',
      address: 'Via Roma 1',
      postalCode: '70100',
      city: 'Bari',
      province: 'BA',
      email: 'salon@example.test',
      phone: '12345678',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.test',
    });
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'new',
        active: false,
        role: 'OWNER',
      }),
    });
    expect(db.salonOnboarding.createMany.mock.calls[0][0].data).toHaveLength(
      checks.length,
    );
    expect(
      db.platformMailOutbox.create.mock.calls[0][0].data.payloadEncrypted,
    ).not.toContain('/admin/activate');
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
  it('translates duplicate tenant constraints to conflict', async () => {
    db.tenant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await expect(
      service.createSalon(admin, { ownerEmail: 'owner@test.test' } as never),
    ).rejects.toThrow(ConflictException);
  });
  it('blocks activation with missing checklist items', async () => {
    db.salonOnboarding.findMany.mockResolvedValue([
      { key: 'TENANT', result: 'PASS' },
    ]);
    await expect(
      service.status(admin, 'salon', { status: 'ATTIVO' }),
    ).rejects.toThrow(BadRequestException);
    expect(db.salonProfile.update).not.toHaveBeenCalled();
  });
  it('allows activation with non applicable optional devices', async () => {
    db.salonOnboarding.findMany.mockResolvedValue(
      checks.map((key) => ({
        key,
        result: ['REGISTRATORE', 'POS', 'STAMPANTE', 'INTEGRAZIONI'].includes(
          key,
        )
          ? 'NA'
          : 'PASS',
      })),
    );
    await service.status(admin, 'salon', { status: 'ATTIVO' });
    expect(db.salonProfile.update).toHaveBeenCalled();
  });
  it('persists configuration and invalidates previous commissioning', async () => {
    await service.saveConfig(admin, 'salon', 'pos', {
      data: {
        provider: 'Nexi',
        mode: 'MANUALE',
        terminalId: 'TEST',
        connection: 'USB',
      },
      secret: 'secret',
    });
    expect(db.platformConfiguration.upsert).toHaveBeenCalled();
    expect(db.salonOnboarding.updateMany).toHaveBeenCalled();
    expect(db.technicalIntervention.create).toHaveBeenCalled();
  });
  it('does not report unsupported device tests as successful', async () => {
    const result = await service.testDevice(admin, 'salon', 'registratore');
    expect(result).toMatchObject({ success: false, supported: false });
    expect(db.platformConfiguration.update).not.toHaveBeenCalled();
  });
  it('rejects secrets and arbitrary tenant identifiers inside configuration JSON', () => {
    expect(() =>
      validateConfiguration('pos', { tenantId: 'another' }),
    ).toThrow();
    expect(() => validateConfiguration('pos', { password: 'plain' })).toThrow();
    expect(() =>
      validateConfiguration('registratore', { port: '99999' }),
    ).toThrow();
  });
  it('accepts valid LAN POS addresses and rejects missing IP or invalid ports', () => {
    const config = {
      provider: 'Provider',
      terminalId: 'T1',
      connection: 'LAN',
      mode: 'MANUALE',
      ip: '192.0.2.20',
      port: '9100',
    };
    expect(() => validateConfiguration('pos', config)).not.toThrow();
    expect(() => validateConfiguration('pos', { ...config, ip: '' })).toThrow();
    expect(() =>
      validateConfiguration('pos', { ...config, port: '70000' }),
    ).toThrow();
  });
  it('requires evidence for commissioning and disallows mandatory NA', async () => {
    await expect(
      service.check(admin, 'salon', 'COLLAUDO', { result: 'PASS', notes: '' }),
    ).rejects.toThrow();
    await expect(
      service.check(admin, 'salon', 'OPERATIVITA', {
        result: 'NA',
        notes: 'not used',
      }),
    ).rejects.toThrow();
  });
  it('invalidates suspended access and revokes technician sessions', async () => {
    db.platformAdmin.findUnique.mockResolvedValue({ ...tech, active: true });
    await service.activeAdmin(admin, tech.id, false);
    expect(db.platformSession.updateMany).toHaveBeenCalledWith({
      where: { adminId: tech.id },
      data: { revokedAt: expect.any(Date) },
    });
  });
  it('records technical interventions without exposing customer data', async () => {
    db.technicianAssignment.findUnique.mockResolvedValue({ adminId: tech.id });
    await service.intervention(tech, 'salon', 'Verificato cablaggio');
    expect(db.technicalIntervention.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'salon',
        adminId: tech.id,
        action: 'NOTE',
        notes: 'Verificato cablaggio',
      },
    });
  });
  it('rejects consumed and expired invitations', async () => {
    db.platformInvitation.findUnique.mockResolvedValue({
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });
    await expect(
      service.activate({ token: 'token', password: 'long-password' }),
    ).rejects.toThrow(BadRequestException);
  });
});
