import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ClientAwardsService } from './client-awards.service';

describe('ClientAwardsService', () => {
  let service: ClientAwardsService;
  const prisma = {
    clientTenant: { findFirst: jest.fn() },
    appointment: { findFirst: jest.fn() },
    clientAward: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientAwardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ClientAwardsService);
    jest.clearAllMocks();
  });

  it('creates an award only for a client associated with the tenant', async () => {
    prisma.clientTenant.findFirst.mockResolvedValue({ id: 'ct-1' });
    prisma.clientAward.create.mockResolvedValue({
      tenantId: 'tenant-1',
      clientGlobalId: 'b32196b2-5ed1-4b94-bfcb-e3f34bde90cf',
      prizeName: 'Piega omaggio',
      status: 'ACTIVE',
    });

    const result = await service.create('tenant-1', {
      clientGlobalId: 'b32196b2-5ed1-4b94-bfcb-e3f34bde90cf',
      prizeName: 'Piega omaggio',
      status: 'ACTIVE',
    });

    expect(result).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-1',
        prizeName: 'Piega omaggio',
      }),
    );
  });

  it('rejects clients from another tenant', async () => {
    prisma.clientTenant.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tenant-1', {
        clientGlobalId: 'b32196b2-5ed1-4b94-bfcb-e3f34bde90cf',
        prizeName: 'Piega omaggio',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
