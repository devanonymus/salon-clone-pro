import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
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


  @Patch(":id/notes")
  updateNotes(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { notes?: string },
  ) {
    return this.clientsService.updateNotes(
      req.user.tenantId,
      id,
      body.notes || "",
    );
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