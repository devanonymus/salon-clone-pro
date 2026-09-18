import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getAll(tenantId: string) {
    return this.prisma.clientTenant.findMany({
      where: {
        tenantId,
        archived: false,
      },
      include: {
        clientGlobal: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateClient(
    tenantId: string,
    clientGlobalId: string,
    body: {
      name?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    const clientTenant = await this.prisma.clientTenant.findFirst({
      where: {
        tenantId,
        clientGlobalId,
      },
      include: {
        clientGlobal: true,
      },
    });

    if (!clientTenant) {
      throw new NotFoundException('Cliente non trovato');
    }

    if (body.name !== undefined || body.phone !== undefined) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.clientGlobal.update({
            where: { id: clientGlobalId },
            data: {
              ...(body.name !== undefined ? { name: body.name } : {}),
              ...(body.phone !== undefined ? { phone: body.phone } : {}),
            },
          });

          if (body.notes !== undefined) {
            await tx.clientTenant.update({
              where: {
                tenantId_clientGlobalId: { tenantId, clientGlobalId },
              },
              data: { notes: body.notes },
            });
          }
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Il numero di telefono appartiene già a un altro cliente',
          );
        }
        throw error;
      }
    } else if (body.notes !== undefined) {
      await this.prisma.clientTenant.update({
        where: {
          tenantId_clientGlobalId: { tenantId, clientGlobalId },
        },
        data: { notes: body.notes },
      });
    }

    return this.prisma.clientTenant.findFirst({
      where: {
        tenantId,
        clientGlobalId,
      },
      include: {
        clientGlobal: true,
      },
    });
  }

  async updateNotes(tenantId: string, clientGlobalId: string, notes: string) {
    const client = await this.prisma.clientTenant.findUnique({
      where: { tenantId_clientGlobalId: { tenantId, clientGlobalId } },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Cliente non trovato');

    return this.prisma.clientTenant.update({
      where: {
        tenantId_clientGlobalId: {
          tenantId,
          clientGlobalId,
        },
      },
      data: {
        notes,
      },
      include: {
        clientGlobal: true,
      },
    });
  }

  async deleteClient(tenantId: string, clientGlobalId: string) {
    const client = await this.prisma.clientTenant.findUnique({
      where: { tenantId_clientGlobalId: { tenantId, clientGlobalId } },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Cliente non trovato');

    return this.prisma.clientTenant.update({
      where: {
        tenantId_clientGlobalId: {
          tenantId,
          clientGlobalId,
        },
      },
      data: {
        archived: true,
      },
      include: {
        clientGlobal: true,
      },
    });
  }

  async createQuick(tenantId: string, name: string, phone: string) {
    const clientGlobal = await this.prisma.clientGlobal.upsert({
      where: { phone },
      update: {
        name,
      },
      create: {
        name,
        phone,
      },
    });

    return this.prisma.clientTenant.upsert({
      where: {
        tenantId_clientGlobalId: {
          tenantId,
          clientGlobalId: clientGlobal.id,
        },
      },
      update: {
        archived: false,
      },
      create: {
        tenantId,
        clientGlobalId: clientGlobal.id,
      },
      include: {
        clientGlobal: true,
      },
    });
  }
}
