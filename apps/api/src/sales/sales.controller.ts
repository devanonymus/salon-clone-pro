import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(private service: SalesService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      clientGlobalId: string;
      total: number | string;
      paymentMethod?: string;
      appointmentId?: string;
      items?: {
        name: string;
        type?: string;
        price: number | string;
        cost?: number | string;
        quantity: number | string;
      }[];
    },
  ) {
    const total = Number(String(body.total).replace(",", "."));

    const items = (body.items || []).map((item) => ({
      name: item.name,
      type: item.type || "service",
      price: Number(String(item.price).replace(",", ".")),
      cost: Number(String(item.cost || 0).replace(",", ".")),
      quantity: Number(item.quantity || 1),
    }));

    return this.service.create(
      req.user.tenantId,
      body.clientGlobalId,
      total,
      items,
      body.paymentMethod,
      body.appointmentId,
    );
  }

  @UseGuards(JwtGuard)
  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }
}