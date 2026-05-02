import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from "@nestjs/common";
import { WhatsappService } from "./whatsapp.service";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get("chats")
  async getChats() {
    return this.whatsappService.getChats();
  }

  @Post("send")
  async sendMessage(@Body() body: { to?: string; text?: string }) {
    if (!body.to) {
      throw new BadRequestException("Numero destinatario mancante");
    }

    if (!body.text) {
      throw new BadRequestException("Testo messaggio mancante");
    }

    return this.whatsappService.sendTextMessage(body.to, body.text);
  }
}