/* Prisma test doubles deliberately support different result shapes per operation. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { PlatformService, type Actor } from './platform.service';
import { PlatformDevicesService } from './platform-devices.service';
import { DeviceDto, DeviceUpdateDto } from './platform.dto';
import { assertDevicesReady, technicalToday } from './device-policy';
const actor: Actor = {
  id: 'tech',
  email: 'tech@example.test',
  name: 'Tech',
  role: 'TECHNICIAN',
};
const body = {
  label: 'POS reception',
  data: {
    provider: 'Provider',
    terminalId: 'T1',
    connection: 'USB',
    mode: 'MANUALE',
  },
  dueDate: '2026-12-10',
};
const record = {
  id: 'device',
  tenantId: 'salon',
  section: 'pos',
  label: body.label,
  version: 2,
  archivedAt: null,
  dueDate: null,
};
describe('Multiple devices and technical deadlines', () => {
  let db: Record<string, any>,
    service: PlatformDevicesService,
    scope: jest.Mock;
  beforeEach(() => {
    process.env.PLATFORM_ENCRYPTION_KEY = 'd'.repeat(64);
    scope = jest.fn().mockResolvedValue(undefined);
    db = {
      platformDevice: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(record),
        create: jest.fn().mockResolvedValue(record),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      platformConfiguration: { findUnique: jest.fn().mockResolvedValue(null) },
      salonOnboarding: { updateMany: jest.fn() },
      salonProfile: { updateMany: jest.fn() },
      technicalIntervention: { create: jest.fn() },
      platformAuditLog: { create: jest.fn() },
    };
    db.$transaction = jest.fn((fn) => fn(db));
    service = new PlatformDevicesService(
      db as unknown as PrismaService,
      { scope } as unknown as PlatformService,
    );
  });
  it('uses the Italian calendar across UTC midnight boundaries', () => {
    expect(technicalToday(new Date('2026-10-23T22:30:00Z')).toISOString()).toBe(
      '2026-10-24T00:00:00.000Z',
    );
    expect(technicalToday(new Date('2026-12-23T23:30:00Z')).toISOString()).toBe(
      '2026-12-24T00:00:00.000Z',
    );
  });
  it('rejects unassigned technicians before reading devices', async () => {
    scope.mockRejectedValue(new ForbiddenException());
    await expect(service.list(actor, 'other', 'pos')).rejects.toThrow(
      ForbiddenException,
    );
    expect(db.platformDevice.findMany).not.toHaveBeenCalled();
  });
  it('always filters devices by the authorized tenant and section', async () => {
    await service.list(actor, 'salon', 'pos');
    expect(db.platformDevice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'salon', section: 'pos' },
        select: expect.not.objectContaining({ secretsEncrypted: true }),
      }),
    );
  });
  it('stores encrypted credentials without returning them', async () => {
    await service.create(actor, 'salon', 'pos', {
      ...body,
      secret: 'private-credential',
    });
    const input = db.platformDevice.create.mock.calls[0][0];
    expect(input.data.secretsEncrypted).not.toContain('private-credential');
    expect(input.select.secretsEncrypted).toBeUndefined();
    expect(db.salonOnboarding.updateMany).toHaveBeenCalled();
  });
  it('explicitly imports an existing credential without exposing or modifying its source', async () => {
    db.platformConfiguration.findUnique.mockResolvedValue({
      id: 'legacy',
      secretsEncrypted: 'already-encrypted',
    });
    await service.create(actor, 'salon', 'pos', body, true);
    expect(db.platformDevice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          legacyConfigurationId: 'legacy',
          secretsEncrypted: 'already-encrypted',
        }),
      }),
    );
  });
  it('rejects duplicate physical identities and repeated imports', async () => {
    db.platformDevice.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await expect(service.create(actor, 'salon', 'pos', body)).rejects.toThrow(
      ConflictException,
    );
  });
  it('never updates a device from another tenant', async () => {
    db.platformDevice.findFirst.mockResolvedValue(null);
    await expect(
      service.update(actor, 'other', 'device', { ...body, version: 2 }),
    ).rejects.toThrow(NotFoundException);
    expect(db.platformDevice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'device', tenantId: 'other' } }),
    );
    expect(db.platformDevice.updateMany).not.toHaveBeenCalled();
  });
  it('rejects stale writes instead of overwriting a configuration', async () => {
    db.platformDevice.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.update(actor, 'salon', 'device', { ...body, version: 1 }),
    ).rejects.toThrow(ConflictException);
    expect(db.platformDevice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'device',
          tenantId: 'salon',
          version: 1,
          archivedAt: null,
        },
      }),
    );
    expect(db.salonOnboarding.updateMany).not.toHaveBeenCalled();
  });
  it('invalidates physical and final commissioning when a configuration changes', async () => {
    await service.update(actor, 'salon', 'device', { ...body, version: 2 });
    expect(db.platformDevice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          physicalCheck: 'PENDING',
          version: { increment: 1 },
          checkedAt: null,
        }),
      }),
    );
    expect(db.salonProfile.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'salon', status: 'ATTIVO' },
      data: { status: 'DA_COLLAUDARE' },
    });
  });
  it('archives and restores logically, retaining the device and history', async () => {
    await service.archive(actor, 'salon', 'device', 2);
    expect(db.platformDevice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          archivedAt: expect.any(Date),
          version: { increment: 1 },
        }),
      }),
    );
    await service.archive(actor, 'salon', 'device', 3, true);
    expect(db.platformDevice.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: 'device',
          tenantId: 'salon',
          version: 3,
          archivedAt: { not: null },
        },
        data: expect.objectContaining({
          archivedAt: null,
          physicalCheck: 'PENDING',
        }),
      }),
    );
  });
  it('rejects PASS for a device with an expired technical deadline', async () => {
    db.platformDevice.findFirst.mockResolvedValue({
      ...record,
      dueDate: new Date('2000-01-01T00:00:00Z'),
    });
    await expect(
      service.check(actor, 'salon', 'device', {
        version: 2,
        result: 'PASS',
        notes: 'Real physical verification',
      }),
    ).rejects.toThrow(BadRequestException);
  });
  it('records physical-check evidence in durable intervention history', async () => {
    await service.check(actor, 'salon', 'device', {
      version: 2,
      result: 'PASS',
      notes: 'Verified with manufacturer procedure',
    });
    expect(db.technicalIntervention.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: expect.stringContaining(
            'Verified with manufacturer procedure',
          ),
        }),
      }),
    );
  });
  it('does not mark unsupported communication as a successful test', async () => {
    await expect(service.test(actor, 'salon', 'device')).resolves.toMatchObject(
      { success: false, supported: false },
    );
    expect(db.platformDevice.updateMany).not.toHaveBeenCalled();
  });
  it('blocks NA and activation when active devices require commissioning', async () => {
    db.platformDevice.count.mockResolvedValue(1);
    await expect(
      assertDevicesReady(db as Prisma.TransactionClient, 'salon', 'POS', 'NA'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      assertDevicesReady(db as Prisma.TransactionClient, 'salon'),
    ).rejects.toThrow(BadRequestException);
  });
  it('rejects invalid calendar dates and missing optimistic versions at the DTO boundary', async () => {
    const invalid = Object.assign(new DeviceDto(), body, {
      dueDate: '2026-02-30',
    });
    expect(
      (await validate(invalid)).some((e) => e.property === 'dueDate'),
    ).toBe(true);
    const noVersion = Object.assign(new DeviceUpdateDto(), body);
    expect(
      (await validate(noVersion)).some((e) => e.property === 'version'),
    ).toBe(true);
  });
});
