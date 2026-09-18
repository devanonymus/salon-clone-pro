import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FiscalService {
  constructor(private prisma: PrismaService) {}

  async printReceipt(tenantId: string, saleId: string) {
    const provider = (process.env.FISCAL_PROVIDER || 'DEMO').toUpperCase();
    if (provider !== 'DEMO') {
      throw new ServiceUnavailableException(
        `Provider fiscale ${provider} non ancora configurato`,
      );
    }

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

    if (sale.fiscalStatus === 'NON_FISCAL') {
      throw new BadRequestException('La vendita è marcata come non fiscale');
    }

    if (['ISSUED', 'DEMO_ISSUED'].includes(sale.fiscalStatus)) {
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sale.updateMany({
        where: {
          id: sale.id,
          tenantId,
          fiscalStatus: { notIn: ['ISSUED', 'DEMO_ISSUED', 'NON_FISCAL'] },
        },
        data: { fiscalStatus: 'DEMO_ISSUED' },
      });

      if (updated.count !== 1) {
        throw new BadRequestException('Scontrino già emesso');
      }

      return tx.fiscalReceipt.create({
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

  status() {
    const provider = (process.env.FISCAL_PROVIDER || 'DEMO').toUpperCase();
    return {
      provider,
      simulated: provider === 'DEMO',
      ready: provider === 'DEMO',
      message:
        provider === 'DEMO'
          ? 'Modalità dimostrativa: nessun documento fiscale reale viene trasmesso'
          : `Provider ${provider} da configurare`,
    };
  }
}
