import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    clientGlobalId: string,
    total: number,
    items?: { name: string; price: number; quantity: number }[],
    paymentMethod?: string,
    appointmentId?: string,
  ) {
    return this.prisma.sale.create({
      data: {
        tenantId,
        clientGlobalId,
        total,
        paymentMethod,
        appointmentId: appointmentId || null,
        items: {
          create: items || [],
        },
      },
      include: {
        clientGlobal: true,
        items: true,
        appointment: true,
      },
    });
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
        createdAt: 'desc',
      },
    });
  }
}