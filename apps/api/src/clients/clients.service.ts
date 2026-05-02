import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getAll(tenantId: string) {
    return this.prisma.clientTenant.findMany({
      where: {
        tenantId,
      },
      include: {
        clientGlobal: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async createQuick(
    tenantId: string,
    name: string,
    phone: string,
  ) {
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
      update: {},
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