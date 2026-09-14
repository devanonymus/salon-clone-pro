import { Module } from '@nestjs/common';
import { MarketingCardsController } from './marketing-cards.controller';
import { MarketingCardsService } from './marketing-cards.service';

@Module({
  controllers: [MarketingCardsController],
  providers: [MarketingCardsService],
})
export class MarketingCardsModule {}
