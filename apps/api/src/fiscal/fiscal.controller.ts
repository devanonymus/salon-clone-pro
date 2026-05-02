import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { FiscalService } from './fiscal.service';

@Controller('fiscal')
export class FiscalController {
  constructor(private service: FiscalService) {}

  @UseGuards(JwtGuard)
  @Post('print-receipt')
  printReceipt(@Req() req: any, @Body() body: { saleId: string }) {
    return this.service.printReceipt(req.user.tenantId, body.saleId);
  }

  @UseGuards(JwtGuard)
  @Get('receipts')
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }
}