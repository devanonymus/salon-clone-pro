import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { FiscalService } from './fiscal.service';
import type { AuthRequest } from '../auth/auth-request';
import { IsUUID } from 'class-validator';

class PrintReceiptDto {
  @IsUUID()
  saleId!: string;
}

@Controller('fiscal')
export class FiscalController {
  constructor(private service: FiscalService) {}

  @UseGuards(JwtGuard)
  @Post('print-receipt')
  printReceipt(@Req() req: AuthRequest, @Body() body: PrintReceiptDto) {
    return this.service.printReceipt(req.user.tenantId, body.saleId);
  }

  @UseGuards(JwtGuard)
  @Get('receipts')
  list(@Req() req: AuthRequest) {
    return this.service.list(req.user.tenantId);
  }

  @UseGuards(JwtGuard)
  @Get('status')
  status() {
    return this.service.status();
  }
}
