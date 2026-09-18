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
import { ServicePricesService } from './service-prices.service';
import {
  CreateServicePriceDto,
  UpdateServicePriceDto,
} from './service-prices.dto';

@Controller('service-prices')
@UseGuards(JwtGuard, RolesGuard)
export class ServicePricesController {
  constructor(private service: ServicePricesService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.service.list(req.user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'MANAGER')
  create(@Req() req: AuthRequest, @Body() body: CreateServicePriceDto) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateServicePriceDto,
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  delete(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.delete(req.user.tenantId, id);
  }
}
