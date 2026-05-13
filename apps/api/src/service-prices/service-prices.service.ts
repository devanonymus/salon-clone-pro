import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ServicePricesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException("tenantId mancante");
    }

    return this.prisma.servicePrice.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });
  }

  async create(tenantId: string, body: any) {
    if (!tenantId) {
      throw new BadRequestException("tenantId mancante");
    }

    const name = String(body?.name || "").trim();

    if (!name) {
      throw new BadRequestException("Nome servizio obbligatorio");
    }

    const category = String(body?.category || "Altro").trim();
    const duration = Number(body?.duration || 30);
    const price = Number(body?.price || 0);
    const cost = Number(body?.cost || 0);

    const existing = await this.prisma.servicePrice.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      if (existing.active === false) {
        return this.prisma.servicePrice.update({
          where: {
            id: existing.id,
          },
          data: {
            category,
            duration,
            price,
            cost,
            active: true,
          },
        });
      }

      throw new ConflictException("Esiste già un servizio con questo nome");
    }

    try {
      return await this.prisma.servicePrice.create({
        data: {
          tenantId,
          name,
          category,
          duration,
          price,
          cost,
          active: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Esiste già un servizio con questo nome");
      }

      throw error;
    }
  }

  async update(tenantId: string, id: string, body: any) {
    if (!tenantId) {
      throw new BadRequestException("tenantId mancante");
    }

    const service = await this.prisma.servicePrice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException("Servizio non trovato");
    }

    const nextName =
      body?.name !== undefined ? String(body.name).trim() : service.name;

    if (!nextName) {
      throw new BadRequestException("Nome servizio obbligatorio");
    }

    const duplicate = await this.prisma.servicePrice.findFirst({
      where: {
        tenantId,
        name: nextName,
        id: {
          not: id,
        },
      },
    });

    if (duplicate) {
      throw new ConflictException("Esiste già un altro servizio con questo nome");
    }

    return this.prisma.servicePrice.update({
      where: {
        id,
      },
      data: {
        name: body?.name !== undefined ? nextName : undefined,
        category:
          body?.category !== undefined ? String(body.category).trim() : undefined,
        duration:
          body?.duration !== undefined ? Number(body.duration) : undefined,
        price:
          body?.price !== undefined ? Number(body.price) : undefined,
        cost:
          body?.cost !== undefined ? Number(body.cost) : undefined,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    if (!tenantId) {
      throw new BadRequestException("tenantId mancante");
    }

    const service = await this.prisma.servicePrice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException("Servizio non trovato");
    }

    return this.prisma.servicePrice.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }
}
