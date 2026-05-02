import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

@Injectable()
export class WhatsappService {
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