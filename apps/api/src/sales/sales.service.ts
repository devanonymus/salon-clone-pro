import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import type { CreateSaleItemDto } from './sales.dto';
import {
  normalizeIdempotencyKey,
  normalizeMoney,
  requestFingerprint,
  sumMoneyLines,
  toCents,
} from '../common/money';

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
    fiscalStatus: 'TO_ISSUE' | 'NON_FISCAL' = 'TO_ISSUE',
    idempotencyKey?: string,
  ) {
    let requestKey: string | undefined;
    try {
      requestKey = normalizeIdempotencyKey(idempotencyKey);
    } catch {
      throw new BadRequestException('Idempotency-Key non valida');
    }

    const normalizedTotal = normalizeMoney(total);
    const normalizedItems = items.map((item) => ({
      ...item,
      price: normalizeMoney(item.price),
      cost: normalizeMoney(item.cost ?? 0),
      technicalCost: normalizeMoney(item.technicalCost ?? item.cost ?? 0),
      laborCost: normalizeMoney(item.laborCost ?? 0),
    }));
    const subtotal = sumMoneyLines(normalizedItems);

    if (toCents(normalizedTotal) > toCents(subtotal)) {
      throw new BadRequestException(
        'Il totale della vendita supera il valore delle righe',
      );
    }

    const fingerprint = requestFingerprint({
      tenantId,
      clientGlobalId,
      appointmentId: appointmentId || null,
      total: normalizedTotal,
      paymentMethod: paymentMethod || null,
      fiscalStatus,
      items: normalizedItems.map((item) => ({
        name: item.name.trim(),
        type: item.type || 'service',
        price: item.price,
        cost: item.cost,
        technicalCost: item.technicalCost,
        laborCost: item.laborCost,
        duration: item.duration || 0,
        staffId: item.staffId || null,
        quantity: item.quantity,
        discount: item.discount ?? 0,
      })),
    });

    if (requestKey) {
      const existing = await this.findByIdempotencyKey(tenantId, requestKey);
      if (existing) {
        this.assertSameRequest(existing.requestHash, fingerprint);
        return existing;
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
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
          ...new Set(
            normalizedItems.map((item) => item.staffId).filter(Boolean),
          ),
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
            idempotencyKey: requestKey || null,
            requestHash: requestKey ? fingerprint : null,
            total: normalizedTotal,
            paymentMethod,
            fiscalStatus,
            appointmentId: appointmentId || null,
            items: {
              create: normalizedItems.map((item) => ({
                name: item.name.trim(),
                type: item.type || 'service',
                price: item.price,
                cost: item.cost,
                technicalCost: item.technicalCost,
                laborCost: item.laborCost,
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
          normalizedItems.map((item) => ({
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
    } catch (error) {
      if (requestKey && this.isUniqueConstraintViolation(error)) {
        const existing = await this.findByIdempotencyKey(tenantId, requestKey);
        if (existing) {
          this.assertSameRequest(existing.requestHash, fingerprint);
          return existing;
        }
      }

      throw error;
    }
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

  private findByIdempotencyKey(tenantId: string, idempotencyKey: string) {
    return this.prisma.sale.findFirst({
      where: { tenantId, idempotencyKey },
      include: {
        clientGlobal: true,
        items: true,
        appointment: { include: { staff: true } },
      },
    });
  }

  private assertSameRequest(
    existingFingerprint: string | null,
    fingerprint: string,
  ) {
    if (existingFingerprint !== fingerprint) {
      throw new ConflictException(
        'Idempotency-Key già utilizzata per una vendita differente',
      );
    }
  }

  private isUniqueConstraintViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
