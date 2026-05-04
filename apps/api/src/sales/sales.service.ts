import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
  ) {}

  async create(
    tenantId: string,
    clientGlobalId: string,
    total: number,
    items?: {
      name: string;
      type?: string;
      price: number;
      cost?: number;
      quantity: number;
    }[],
    paymentMethod?: string,
    appointmentId?: string,
  ) {
    const sale = await this.prisma.sale.create({
      data: {
        tenantId,
        clientGlobalId,
        total,
        paymentMethod,
        appointmentId: appointmentId || null,
        items: {
          create: (items || []).map((item) => ({
            name: item.name,
            type: item.type || "service",
            price: item.price,
            cost: item.cost || 0,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        clientGlobal: true,
        items: true,
        appointment: true,
      },
    });

    await this.inventory.consumeForSale(
      tenantId,
      sale.id,
      (items || []).map((item) => ({
        name: item.name,
        type: item.type || "service",
        quantity: item.quantity,
      })),
    );

    return sale;
  }

  async list(tenantId: string) {
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: {
        clientGlobal: true,
        items: true,
        appointment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}