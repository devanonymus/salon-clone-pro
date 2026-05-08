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
      technicalCost?: number;
      laborCost?: number;
      duration?: number;
      staffId?: string | null;
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
            technicalCost: item.technicalCost ?? item.cost ?? 0,
            laborCost: item.laborCost || 0,
            duration: item.duration || 0,
            staffId: item.staffId || null,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        clientGlobal: true,
        items: true,
        appointment: {
          include: {
            staff: true,
          },
        },
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
        appointment: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}