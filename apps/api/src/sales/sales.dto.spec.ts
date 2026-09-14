import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSaleDto } from './sales.dto';

describe('CreateSaleDto', () => {
  const validPayload = {
    clientGlobalId: '7fa85f64-5717-4562-b3fc-2c963f66afa6',
    total: 50,
    items: [
      {
        name: 'Piega',
        type: 'service',
        price: 50,
        quantity: 1,
      },
    ],
  };

  it('accepts a valid nested sale payload', async () => {
    const dto = plainToInstance(CreateSaleDto, validPayload);
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a negative item quantity', async () => {
    const dto = plainToInstance(CreateSaleDto, {
      ...validPayload,
      items: [{ ...validPayload.items[0], quantity: -1 }],
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'items')).toBe(true);
  });
});
