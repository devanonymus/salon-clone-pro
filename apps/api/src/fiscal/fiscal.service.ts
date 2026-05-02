import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FiscalService {
  constructor(private prisma: PrismaService) {}

  async printReceipt(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: {
        clientGlobal: true,
        items: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Vendita non trovata');
    }

    if (sale.fiscalStatus === 'ISSUED') {
      throw new BadRequestException('Scontrino già emesso');
    }

    const payload = {
      mode: 'DEMO',
      saleId: sale.id,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      client: {
        name: sale.clientGlobal.name,
        phone: sale.clientGlobal.phone,
      },
      items: sale.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity,
      })),
      printedAt: new Date().toISOString(),
    };

    const simulatedResponse = {
      ok: true,
      fiscalPrinter: 'DEMO',
      receiptNumber: `DEMO-${Date.now()}`,
      message: 'Scontrino demo emesso correttamente',
    };

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        fiscalStatus: 'ISSUED',
      },
    });

    return this.prisma.fiscalReceipt.create({
      data: {
        tenantId,
        saleId,
        provider: 'DEMO',
        status: 'DEMO_PRINTED',
        payload,
        response: simulatedResponse,
      },
      include: {
        sale: {
          include: {
            clientGlobal: true,
            items: true,
          },
        },
      },
    });
  }

  async list(tenantId: string) {
    return this.prisma.fiscalReceipt.findMany({
      where: { tenantId },
      include: {
        sale: {
          include: {
            clientGlobal: true,
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
