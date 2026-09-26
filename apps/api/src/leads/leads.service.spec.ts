import type { PrismaService } from '../prisma.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const create = jest.fn();
  const prisma = { lead: { create } } as unknown as PrismaService;
  const service = new LeadsService(prisma);

  beforeEach(() => {
    create.mockReset();
  });

  it('stores a new demo lead in the NEW stage', async () => {
    create.mockResolvedValue({
      id: 'lead-1',
      source: 'demo',
      stage: 'NEW',
      createdAt: new Date('2026-09-27T00:00:00Z'),
    });

    const result = await service.create({
      leadSource: 'demo',
      name: 'Mario Rossi',
      salon: 'Studio Mario',
      phone: '3331234567',
      email: 'MARIO@EXAMPLE.COM',
      privacyAccepted: true,
    });

    expect(create).toHaveBeenCalledTimes(1);
    const calls = create.mock.calls as unknown as Array<
      [{ data: { source: string; stage: string; email: string } }]
    >;
    expect(calls[0][0].data).toMatchObject({
      source: 'demo',
      stage: 'NEW',
      email: 'mario@example.com',
    });
    expect(result).toMatchObject({
      accepted: true,
      lead: { id: 'lead-1' },
    });
  });

  it('accepts honeypot traffic without storing it', async () => {
    const result = await service.create({
      leadSource: 'salon_score',
      name: 'Bot Test',
      salon: 'Bot',
      phone: '000000',
      email: 'bot@example.com',
      privacyAccepted: true,
      website: 'https://spam.example',
    });

    expect(create).not.toHaveBeenCalled();
    expect(result).toEqual({ accepted: true });
  });
});
