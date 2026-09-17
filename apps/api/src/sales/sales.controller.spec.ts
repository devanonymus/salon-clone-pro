import { Test, TestingModule } from '@nestjs/testing';
import type { AuthRequest } from '../auth/auth-request';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController', () => {
  let controller: SalesController;
  const createSale = jest.fn();

  beforeEach(async () => {
    createSale.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [{ provide: SalesService, useValue: { create: createSale } }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('forwards the selected fiscal status to the service', async () => {
    const request = {
      user: {
        userId: 'a516564b-a494-4037-8c06-dc291a99c31c',
        tenantId: '2b37ef53-4be5-42ed-a73f-ef4227ce368c',
        role: 'OWNER',
        username: 'owner',
      },
    } as AuthRequest;
    const body = {
      clientGlobalId: '80f04762-72fe-4737-a41d-47f99b30635f',
      total: 45,
      paymentMethod: 'cash',
      fiscalStatus: 'NON_FISCAL' as const,
      items: [
        {
          name: 'Piega',
          type: 'service' as const,
          price: 45,
          quantity: 1,
        },
      ],
    };

    createSale.mockResolvedValue({ id: 'sale-id' });

    await controller.create(request, body, 'checkout-key');

    expect(createSale).toHaveBeenCalledWith(
      request.user.tenantId,
      body.clientGlobalId,
      body.total,
      body.items,
      body.paymentMethod,
      undefined,
      body.fiscalStatus,
      'checkout-key',
    );
  });
});
