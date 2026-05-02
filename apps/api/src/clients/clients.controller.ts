import {
  Body,
  Controller,
  Get,
  Post,
  BadRequestException,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { JwtGuard } from "../auth/jwt.guard";

@Controller("clients")
@UseGuards(JwtGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  getAll(@Req() req: any) {
    return this.clientsService.getAll(req.user.tenantId);
  }

  @Post("quick")
  createQuick(
    @Req() req: any,
    @Body() body: { name?: string; phone?: string },
  ) {
    if (!body.name) {
      throw new BadRequestException("Nome mancante");
    }

    if (!body.phone) {
      throw new BadRequestException("Telefono mancante");
    }

    return this.clientsService.createQuick(
      req.user.tenantId,
      body.name,
      body.phone,
    );
  }
}