import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import type { CreateSaleItemDto } from './sales.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async create(
    tenantId: string,
    clientGlobalId: string,
    total: number,
    items: CreateSaleItemDto[],
    paymentMethod?: string,
    appointmentId?: string,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (total > subtotal + 0.01) {
      throw new BadRequestException(
        'Il totale della vendita supera il valore delle righe',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const clientTenant = await tx.clientTenant.findFirst({
        where: { tenantId, clientGlobalId, archived: false },
      });
      if (!clientTenant) {
        throw new NotFoundException('Cliente non associato a questo salone');
      }

      if (appointmentId) {
        const appointment = await tx.appointment.findFirst({
          where: { id: appointmentId, tenantId },
          include: { clientTenant: true, sale: true },
        });
        if (!appointment) {
          throw new NotFoundException('Appuntamento non trovato');
        }
        if (appointment.clientTenant.clientGlobalId !== clientGlobalId) {
          throw new BadRequestException(
            "L'appuntamento non appartiene al cliente selezionato",
          );
        }
        if (appointment.sale) {
          throw new ConflictException("L'appuntamento è già stato incassato");
        }
      }

      const staffIds = [
        ...new Set(items.map((item) => item.staffId).filter(Boolean)),
      ] as string[];
      if (staffIds.length) {
        const validStaff = await tx.staff.count({
          where: { tenantId, active: true, id: { in: staffIds } },
        });
        if (validStaff !== staffIds.length) {
          throw new NotFoundException(
            'Uno o più collaboratori non appartengono al salone',
          );
        }
      }

      const sale = await tx.sale.create({
        data: {
          tenantId,
          clientGlobalId,
          total,
          paymentMethod,
          appointmentId: appointmentId || null,
          items: {
            create: items.map((item) => ({
              name: item.name.trim(),
              type: item.type || 'service',
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
      });

      await this.inventory.consumeForSale(
        tenantId,
        sale.id,
        items.map((item) => ({
          name: item.name,
          type: item.type || 'service',
          quantity: item.quantity,
        })),
        tx,
      );

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: {
          clientGlobal: true,
          items: true,
          appointment: { include: { staff: true } },
        },
      });
    });
  }

  async list(tenantId: string) {
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: {
        clientGlobal: true,
        items: true,
        appointment: { include: { staff: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
