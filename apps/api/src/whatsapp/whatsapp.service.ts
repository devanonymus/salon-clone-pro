import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { SaveWhatsappConfigDto } from './whatsapp.dto';

type MetaMessageResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string; code?: number };
};

type WebhookMessage = {
  from?: string;
  id?: string;
  text?: { body?: string };
};

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const config = await this.prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return {
        enabled: false,
        phoneNumberId: '',
        businessAccountId: '',
        apiVersion: 'v21.0',
        hasToken: false,
      };
    }

    return {
      enabled: config.enabled,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId || '',
      apiVersion: config.apiVersion || 'v21.0',
      hasToken: Boolean(config.accessTokenEncrypted),
    };
  }

  async saveConfig(tenantId: string, body: SaveWhatsappConfigDto) {
    const existing = await this.prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId },
    });

    const phoneNumberId = body.phoneNumberId ?? existing?.phoneNumberId ?? '';
    const accessTokenEncrypted = body.accessToken
      ? this.encryptSecret(body.accessToken)
      : existing?.accessTokenEncrypted || '';
    const enabled = body.enabled ?? existing?.enabled ?? false;

    if (enabled && (!phoneNumberId || !accessTokenEncrypted)) {
      throw new BadRequestException(
        'Numero WhatsApp e access token sono obbligatori per attivare il canale',
      );
    }

    await this.prisma.tenantWhatsappConfig.upsert({
      where: { tenantId },
      update: {
        phoneNumberId,
        businessAccountId:
          body.businessAccountId ?? existing?.businessAccountId ?? null,
        accessTokenEncrypted,
        apiVersion: body.apiVersion ?? existing?.apiVersion ?? 'v21.0',
        enabled,
      },
      create: {
        tenantId,
        phoneNumberId,
        businessAccountId: body.businessAccountId || null,
        accessTokenEncrypted,
        apiVersion: body.apiVersion || 'v21.0',
        enabled,
      },
    });

    return this.getConfig(tenantId);
  }

  async getChats(tenantId: string) {
    return { chats: await this.getConversations(tenantId) };
  }

  getConversations(tenantId: string) {
    return this.prisma.whatsappConversation.findMany({
      where: { tenantId },
      orderBy: { lastAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });
  }

  async sendConversationMessage(
    tenantId: string,
    conversationId: string,
    text: string,
  ) {
    const conversation = await this.prisma.whatsappConversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation) {
      throw new BadRequestException('Conversazione non trovata');
    }

    return this.sendTextMessage(tenantId, conversation.phone, text);
  }

  async sendTextMessage(tenantId: string, to: string, text: string) {
    const config = await this.prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId },
    });

    if (
      !config?.enabled ||
      !config.phoneNumberId ||
      !config.accessTokenEncrypted
    ) {
      throw new ServiceUnavailableException(
        'Canale WhatsApp non configurato per questo salone',
      );
    }

    const accessToken = this.decryptSecret(config.accessTokenEncrypted);
    const normalizedPhone = to.replace(/^\+/, '');
    const configuredTimeout = Number(process.env.WHATSAPP_HTTP_TIMEOUT_MS);
    const timeout =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 10_000;
    let response: Response;
    try {
      response = await fetch(
        `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'text',
            text: { preview_url: false, body: text },
          }),
          signal: AbortSignal.timeout(timeout),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'WhatsApp non raggiungibile, riprova tra poco',
      );
    }

    const data = (await response.json()) as MetaMessageResponse;
    if (!response.ok) {
      throw new ServiceUnavailableException({
        message: 'Errore invio messaggio WhatsApp',
        providerCode: data.error?.code,
        providerMessage: data.error?.message,
      });
    }

    const providerId = data.messages?.[0]?.id || null;
    await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.whatsappConversation.upsert({
        where: { tenantId_phone: { tenantId, phone: normalizedPhone } },
        update: { lastMessage: text, lastAt: new Date() },
        create: {
          tenantId,
          phone: normalizedPhone,
          lastMessage: text,
          lastAt: new Date(),
        },
      });

      await tx.whatsappMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUT',
          phone: normalizedPhone,
          text,
          providerId,
        },
      });
    });

    return { ok: true, providerId };
  }

  async handleWebhook(body: unknown) {
    const entries = this.extractWebhookEntries(body);

    for (const entry of entries) {
      const config = await this.prisma.tenantWhatsappConfig.findFirst({
        where: { phoneNumberId: entry.phoneNumberId, enabled: true },
      });
      if (!config) continue;

      for (const message of entry.messages) {
        const phone = message.from?.replace(/^\+/, '');
        const text = message.text?.body;
        if (!phone || !text) continue;

        if (message.id) {
          const duplicate = await this.prisma.whatsappMessage.findFirst({
            where: { providerId: message.id },
            select: { id: true },
          });
          if (duplicate) continue;
        }

        try {
          await this.prisma.$transaction(async (tx) => {
            const conversation = await tx.whatsappConversation.upsert({
              where: { tenantId_phone: { tenantId: config.tenantId, phone } },
              update: { lastMessage: text, lastAt: new Date() },
              create: {
                tenantId: config.tenantId,
                phone,
                lastMessage: text,
                lastAt: new Date(),
              },
            });

            await tx.whatsappMessage.create({
              data: {
                conversationId: conversation.id,
                direction: 'IN',
                phone,
                text,
                providerId: message.id || null,
              },
            });
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            continue;
          }
          throw error;
        }
      }
    }

    return { ok: true };
  }

  assertWebhookSignature(rawBody: Buffer, signature?: string) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      throw new ServiceUnavailableException(
        'WHATSAPP_APP_SECRET non configurato',
      );
    }

    const expected = `sha256=${createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;
    const received = signature || '';
    const valid =
      received.length === expected.length &&
      timingSafeEqual(Buffer.from(received), Buffer.from(expected));

    if (!valid) {
      throw new UnauthorizedException('Firma webhook WhatsApp non valida');
    }
  }

  private encryptSecret(value: string) {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptSecret(value: string) {
    if (!value.startsWith('enc:v1:')) return value;

    try {
      const [, , ivValue, tagValue, encryptedValue] = value.split(':');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.getEncryptionKey(),
        Buffer.from(ivValue, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Impossibile leggere la configurazione WhatsApp',
      );
    }
  }

  private getEncryptionKey() {
    const secret = process.env.WHATSAPP_ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'WHATSAPP_ENCRYPTION_KEY deve contenere almeno 32 caratteri',
      );
    }

    return createHash('sha256').update(secret).digest();
  }

  private extractWebhookEntries(body: unknown) {
    const result: Array<{
      phoneNumberId: string;
      messages: WebhookMessage[];
    }> = [];

    if (!body || typeof body !== 'object') return result;
    const entries = (body as { entry?: unknown }).entry;
    if (!Array.isArray(entries)) return result;

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const changes = (entry as { changes?: unknown }).changes;
      if (!Array.isArray(changes)) continue;

      for (const change of changes) {
        if (!change || typeof change !== 'object') continue;
        const value = (change as { value?: unknown }).value;
        if (!value || typeof value !== 'object') continue;

        const typedValue = value as {
          metadata?: { phone_number_id?: string };
          messages?: WebhookMessage[];
        };
        const phoneNumberId = typedValue.metadata?.phone_number_id;
        if (phoneNumberId && Array.isArray(typedValue.messages)) {
          result.push({ phoneNumberId, messages: typedValue.messages });
        }
      }
    }

    return result;
  }
}
