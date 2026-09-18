import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp/webhook')
export class WhatsappWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  verifyWebhook(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (expectedToken && mode === 'subscribe' && token === expectedToken) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Token webhook non valido');
  }

  @Post()
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: unknown,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Payload webhook non disponibile');
    }
    this.whatsappService.assertWebhookSignature(req.rawBody, signature);
    await this.whatsappService.handleWebhook(body);

    return {
      ok: true,
    };
  }
}
