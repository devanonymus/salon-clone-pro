import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WhatsappService } from './whatsapp.service';
import {
  SaveWhatsappConfigDto,
  SendConversationMessageDto,
  SendWhatsappMessageDto,
} from './whatsapp.dto';

@Controller('whatsapp')
@UseGuards(JwtGuard, RolesGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('config')
  getConfig(@Req() req: AuthRequest) {
    return this.whatsappService.getConfig(req.user.tenantId);
  }

  @Post('config')
  @Roles('OWNER', 'MANAGER')
  saveConfig(@Req() req: AuthRequest, @Body() body: SaveWhatsappConfigDto) {
    return this.whatsappService.saveConfig(req.user.tenantId, body);
  }

  @Get('chats')
  async getChats(@Req() req: AuthRequest) {
    return this.whatsappService.getChats(req.user.tenantId);
  }

  @Get('conversations')
  getConversations(@Req() req: AuthRequest) {
    return this.whatsappService.getConversations(req.user.tenantId);
  }

  @Post('conversations/:id/send')
  sendConversationMessage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: SendConversationMessageDto,
  ) {
    return this.whatsappService.sendConversationMessage(
      req.user.tenantId,
      id,
      body.text,
    );
  }

  @Post('send')
  async sendMessage(
    @Req() req: AuthRequest,
    @Body() body: SendWhatsappMessageDto,
  ) {
    const text = body.text || body.message;

    if (!text) {
      throw new BadRequestException('Testo messaggio mancante');
    }

    return this.whatsappService.sendTextMessage(
      req.user.tenantId,
      body.to,
      text,
    );
  }
}
