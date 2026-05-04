import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { ServicePricesService } from "./service-prices.service";

@Controller("service-prices")
@UseGuards(JwtGuard)
export class ServicePricesController {
  constructor(private service: ServicePricesService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.service.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  delete(@Req() req: any, @Param("id") id: string) {
    return this.service.delete(req.user.tenantId, id);
  }
}