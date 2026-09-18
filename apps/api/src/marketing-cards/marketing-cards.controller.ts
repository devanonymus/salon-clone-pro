import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MarketingCardsService } from './marketing-cards.service';
import {
  AddMarketingCardPaymentDto,
  CreateMarketingCardDto,
  CreateMarketingCardSaleDto,
  SaveMarketingCardTemplateDto,
  UpdateMarketingCardDto,
} from './marketing-cards.dto';

@Controller('marketing/cards')
@UseGuards(JwtGuard, RolesGuard)
export class MarketingCardsController {
  constructor(private readonly service: MarketingCardsService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.service.list(req.user.tenantId);
  }

  @Get('sales')
  listSales(@Req() req: AuthRequest) {
    return this.service.listSales(req.user.tenantId);
  }

  @Post('sales')
  createSale(
    @Req() req: AuthRequest,
    @Body() body: CreateMarketingCardSaleDto,
  ) {
    return this.service.createSale(req.user.tenantId, body);
  }

  @Post('sales/:id/payments')
  addSalePayment(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: AddMarketingCardPaymentDto,
  ) {
    return this.service.addSalePayment(req.user.tenantId, id, body);
  }

  @Patch('sales/:id/use')
  useSale(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.useSale(req.user.tenantId, id);
  }

  @Delete('sales/:id')
  @Roles('OWNER', 'MANAGER')
  removeSale(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.removeSale(req.user.tenantId, id);
  }

  @Get('template')
  getTemplate(@Req() req: AuthRequest) {
    return this.service.getTemplate(req.user.tenantId);
  }

  @Post('template')
  @Roles('OWNER', 'MANAGER')
  saveTemplate(
    @Req() req: AuthRequest,
    @Body() body: SaveMarketingCardTemplateDto,
  ) {
    return this.service.saveTemplate(req.user.tenantId, body);
  }

  @Post()
  @Roles('OWNER', 'MANAGER')
  create(@Req() req: AuthRequest, @Body() body: CreateMarketingCardDto) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateMarketingCardDto,
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
