import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';

describe('SalesService', () => {
  let service: SalesService;
  const prisma = { $transaction: jest.fn() };
  const inventory = { consumeForSale: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryService, useValue: inventory },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a total greater than the item subtotal', async () => {
    await expect(
      service.create('tenant-1', 'client-1', 101, [
        { name: 'Piega', type: 'service', price: 50, quantity: 2 },
      ]),
    ).rejects.toThrow('Il totale della vendita supera il valore delle righe');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
