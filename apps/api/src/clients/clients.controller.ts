import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import {
  CreateQuickClientDto,
  UpdateClientDto,
  UpdateClientNotesDto,
} from './clients.dto';

@Controller('clients')
@UseGuards(JwtGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  getAll(@Req() req: AuthRequest) {
    return this.clientsService.getAll(req.user.tenantId);
  }

  @Patch(':id')
  updateClient(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(req.user.tenantId, id, {
      name: body.name,
      phone: body.phone,
      notes: body.notes,
    });
  }

  @Patch(':id/notes')
  updateNotes(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateClientNotesDto,
  ) {
    return this.clientsService.updateNotes(req.user.tenantId, id, body.notes);
  }

  @Delete(':id')
  deleteClient(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.deleteClient(req.user.tenantId, id);
  }

  @Post('quick')
  createQuick(@Req() req: AuthRequest, @Body() body: CreateQuickClientDto) {
    return this.clientsService.createQuick(
      req.user.tenantId,
      body.name,
      body.phone,
    );
  }
}
