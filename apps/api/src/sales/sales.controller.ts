import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { SalesService } from './sales.service';
import type { AuthRequest } from '../auth/auth-request';
import { CreateSaleDto } from './sales.dto';

@Controller('sales')
export class SalesController {
  constructor(private service: SalesService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Req() req: AuthRequest,
    @Body() body: CreateSaleDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.create(
      req.user.tenantId,
      body.clientGlobalId,
      body.total,
      body.items,
      body.paymentMethod,
      body.appointmentId,
      body.fiscalStatus,
      idempotencyKey,
    );
  }

  @UseGuards(JwtGuard)
  @Get()
  list(@Req() req: AuthRequest) {
    return this.service.list(req.user.tenantId);
  }
}
