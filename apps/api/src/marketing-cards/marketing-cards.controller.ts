import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { MarketingCardsService } from "./marketing-cards.service";

@Controller("marketing/cards")
@UseGuards(JwtGuard)
export class MarketingCardsController {
  constructor(private readonly service: MarketingCardsService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }


  @Get("sales")
  listSales(@Req() req: any) {
    return this.service.listSales(req.user.tenantId);
  }

  @Post("sales")
  createSale(
    @Req() req: any,
    @Body()
    body: {
      clientTenantId?: string;
      clientName: string;
      whatsapp?: string;
      cardName: string;
      price?: number;
      total?: number;
      sessions?: any;
      appointments?: any;
    },
  ) {
    return this.service.createSale(req.user.tenantId, body);
  }

  @Patch("sales/:id/use")
  useSale(@Req() req: any, @Param("id") id: string) {
    return this.service.useSale(req.user.tenantId, id);
  }

  @Delete("sales/:id")
  removeSale(@Req() req: any, @Param("id") id: string) {
    return this.service.removeSale(req.user.tenantId, id);
  }

  @Get("template")
  getTemplate(@Req() req: any) {
    return this.service.getTemplate(req.user.tenantId);
  }

  @Post("template")
  saveTemplate(
    @Req() req: any,
    @Body()
    body: {
      logoUrl?: string;
      salonName?: string;
      templateStyle?: string;
      primaryColor?: string;
      accentColor?: string;
      title?: string;
      subtitle?: string;
      promiseText?: string;
      valueText?: string;
      bonusText?: string;
      urgencyText?: string;
      guaranteeText?: string;
      ctaText?: string;
      footerText?: string;
      signature?: string;
      promoMessageTemplate?: string;
      confirmMessageTemplate?: string;
    },
  ) {
    return this.service.saveTemplate(req.user.tenantId, body);
  }

  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
    },
  ) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
      active?: boolean;
    },
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
