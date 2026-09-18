import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates only the active user in the current tenant', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.changePin(
        {
          userId: 'user-1',
          tenantId: 'tenant-1',
          role: 'OWNER',
          username: 'admin',
        },
        '1234',
      ),
    ).resolves.toEqual({ ok: true, message: 'PIN aggiornato correttamente' });

    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
  });
});
