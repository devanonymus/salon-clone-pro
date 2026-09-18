import { Module } from '@nestjs/common';
import { ClientAwardsController } from './client-awards.controller';
import { ClientAwardsService } from './client-awards.service';

@Module({
  controllers: [ClientAwardsController],
  providers: [ClientAwardsService],
})
export class ClientAwardsModule {}
