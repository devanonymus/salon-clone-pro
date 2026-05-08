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
        technicalCost?: number | string;
        laborCost?: number | string;
        duration?: number | string;
        staffId?: string | null;
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
      technicalCost: Number(String(item.technicalCost ?? item.cost ?? 0).replace(",", ".")),
      laborCost: Number(String(item.laborCost || 0).replace(",", ".")),
      duration: Number(item.duration || 0),
      staffId: item.staffId || null,
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