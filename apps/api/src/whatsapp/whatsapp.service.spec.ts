import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService', () => {
  let service: WhatsappService;
  const previousSecret = process.env.WHATSAPP_APP_SECRET;

  beforeEach(async () => {
    process.env.WHATSAPP_APP_SECRET = 'test-app-secret';
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappService, { provide: PrismaService, useValue: {} }],
    }).compile();
    service = module.get(WhatsappService);
  });

  afterAll(() => {
    process.env.WHATSAPP_APP_SECRET = previousSecret;
  });

  it('accepts a valid Meta webhook signature', () => {
    const body = Buffer.from('{"entry":[]}');
    const signature = `sha256=${createHmac('sha256', 'test-app-secret')
      .update(body)
      .digest('hex')}`;

    expect(() => service.assertWebhookSignature(body, signature)).not.toThrow();
  });

  it('rejects a forged Meta webhook signature', () => {
    expect(() =>
      service.assertWebhookSignature(Buffer.from('{}'), 'sha256=invalid'),
    ).toThrow(UnauthorizedException);
  });
});
