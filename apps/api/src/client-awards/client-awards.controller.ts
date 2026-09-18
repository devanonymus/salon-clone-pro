import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../auth/auth-request';
import { JwtGuard } from '../auth/jwt.guard';
import { ClientAwardsService } from './client-awards.service';
import {
  CreateClientAwardDto,
  ListClientAwardsQueryDto,
  UpdateClientAwardStatusDto,
} from './client-awards.dto';

@Controller('client-awards')
@UseGuards(JwtGuard)
export class ClientAwardsController {
  constructor(private readonly service: ClientAwardsService) {}

  @Get()
  list(@Req() req: AuthRequest, @Query() query: ListClientAwardsQueryDto) {
    return this.service.list(req.user.tenantId, query);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() body: CreateClientAwardDto) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateClientAwardStatusDto,
  ) {
    return this.service.updateStatus(req.user.tenantId, id, body);
  }
}
