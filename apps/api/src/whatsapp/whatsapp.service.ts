import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class WhatsappService {
  constructor(private prisma: PrismaService) {}

  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  private checkConfig() {
    if (!this.accessToken) {
      throw new InternalServerErrorException("WHATSAPP_ACCESS_TOKEN mancante");
    }

    if (!this.phoneNumberId) {
      throw new InternalServerErrorException("WHATSAPP_PHONE_NUMBER_ID mancante");
    }
  }

  async getConfig(tenantId: string) {
    const config = await this.prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return {
        enabled: false,
        phoneNumberId: "",
        businessAccountId: "",
        apiVersion: "v21.0",
        hasToken: false,
      };
    }

    return {
      enabled: config.enabled,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId || "",
      apiVersion: config.apiVersion || "v21.0",
      hasToken: Boolean(config.accessTokenEncrypted),
    };
  }

  async saveConfig(
    tenantId: string,
    body: {
      phoneNumberId?: string;
      businessAccountId?: string;
      accessToken?: string;
      apiVersion?: string;
      enabled?: boolean;
    },
  ) {
    const existing = await this.prisma.tenantWhatsappConfig.findUnique({
      where: { tenantId },
    });

    const accessTokenEncrypted =
      body.accessToken && body.accessToken.trim()
        ? body.accessToken.trim()
        : existing?.accessTokenEncrypted || "";

    return this.prisma.tenantWhatsappConfig.upsert({
      where: { tenantId },
      update: {
        phoneNumberId: body.phoneNumberId || existing?.phoneNumberId || "",
        businessAccountId: body.businessAccountId || null,
        accessTokenEncrypted,
        apiVersion: body.apiVersion || "v21.0",
        enabled: Boolean(body.enabled),
      },
      create: {
        tenantId,
        phoneNumberId: body.phoneNumberId || "",
        businessAccountId: body.businessAccountId || null,
        accessTokenEncrypted,
        apiVersion: body.apiVersion || "v21.0",
        enabled: Boolean(body.enabled),
      },
    });
  }

  async getChats() {
    return {
      chats: [],
    };
  }

  async sendTextMessage(to: string, text: string) {
    this.checkConfig();

    if (!to) {
      throw new BadRequestException("Numero destinatario mancante");
    }

    if (!text) {
      throw new BadRequestException("Testo messaggio mancante");
    }

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: text,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new InternalServerErrorException({
        message: "Errore invio messaggio WhatsApp",
        error: data,
      });
    }

    return data;
  }

  async handleIncomingWebhook(body: any) {
    console.log("Webhook WhatsApp ricevuto:", JSON.stringify(body, null, 2));

    return {
      ok: true,
    };
  }

  async handleWebhook(body: any) {
    return this.handleIncomingWebhook(body);
  }
}
