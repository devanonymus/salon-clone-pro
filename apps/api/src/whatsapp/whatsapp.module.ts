import { Module } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { PrismaService } from "../prisma.service";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";
import { WhatsappWebhookController } from "./whatsapp.webhook.controller";

@Module({
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [WhatsappService, PrismaService, JwtGuard],
  exports: [WhatsappService],
})
export class WhatsappModule {}
