import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';

@Module({
  providers: [FiscalService],
  controllers: [FiscalController],
})
export class FiscalModule {}
