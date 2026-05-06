import { Module } from "@nestjs/common";
import { MarketingCardsController } from "./marketing-cards.controller";
import { MarketingCardsService } from "./marketing-cards.service";
import { PrismaService } from "../prisma.service";
import { JwtGuard } from "../auth/jwt.guard";

@Module({
  controllers: [MarketingCardsController],
  providers: [MarketingCardsService, PrismaService, JwtGuard],
})
export class MarketingCardsModule {}
