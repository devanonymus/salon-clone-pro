import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { WhatsappService } from "./whatsapp.service";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get("config")
  @UseGuards(JwtGuard)
  getConfig(@Req() req: any) {
    return this.whatsappService.getConfig(req.user.tenantId);
  }

  @Post("config")
  @UseGuards(JwtGuard)
  saveConfig(
    @Req() req: any,
    @Body()
    body: {
      phoneNumberId?: string;
      businessAccountId?: string;
      accessToken?: string;
      apiVersion?: string;
      enabled?: boolean;
    },
  ) {
    return this.whatsappService.saveConfig(req.user.tenantId, body);
  }

  @Get("chats")
  async getChats() {
    return this.whatsappService.getChats();
  }

  @Post("send")
  async sendMessage(@Body() body: { to?: string; text?: string; message?: string }) {
    if (!body.to) {
      throw new BadRequestException("Numero destinatario mancante");
    }

    const text = body.text || body.message;

    if (!text) {
      throw new BadRequestException("Testo messaggio mancante");
    }

    return this.whatsappService.sendTextMessage(body.to, text);
  }
}
