import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const prisma = {
    clientTenant: { findFirst: jest.fn() },
    staff: { findFirst: jest.fn() },
    servicePrice: { findMany: jest.fn() },
    appointment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses service durations configured for the tenant', async () => {
    prisma.clientTenant.findFirst.mockResolvedValue({ id: 'client-tenant-1' });
    prisma.staff.findFirst.mockResolvedValue({ id: 'staff-1' });
    prisma.servicePrice.findMany.mockResolvedValue([
      { name: 'Piega', duration: 35 },
      { name: 'Taglio', duration: 25 },
    ]);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.create.mockResolvedValue({
      tenantId: 'tenant-1',
      clientTenantId: 'client-tenant-1',
      staffId: 'staff-1',
      date: new Date('2026-09-18T08:00:00.000Z'),
      duration: 60,
      note: 'Piega + Taglio',
    });

    const result = await service.create('tenant-1', {
      clientTenantId: 'client-tenant-1',
      date: '2026-09-18T08:00:00.000Z',
      services: ['Piega', 'Taglio'],
      staffId: 'staff-1',
    });

    expect(result).toEqual(expect.objectContaining({ duration: 60 }));
  });

  it('rejects overlapping appointments for the same staff member', async () => {
    prisma.clientTenant.findFirst.mockResolvedValue({ id: 'client-tenant-1' });
    prisma.staff.findFirst.mockResolvedValue({ id: 'staff-1' });
    prisma.servicePrice.findMany.mockResolvedValue([
      { name: 'Piega', duration: 30 },
    ]);
    prisma.appointment.findMany.mockResolvedValue([
      {
        id: 'existing',
        date: new Date('2026-09-18T08:00:00.000Z'),
        duration: 45,
      },
    ]);

    await expect(
      service.create('tenant-1', {
        clientTenantId: 'client-tenant-1',
        date: '2026-09-18T08:30:00.000Z',
        services: ['Piega'],
        staffId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});
