import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class MarketingCardsService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.marketingCard.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(
    tenantId: string,
    body: {
      name: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
    },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException("Nome card mancante");
    }

    return this.prisma.marketingCard.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: body.name.trim(),
        },
      },
      update: {
        price: Number(body.price || 0),
        sessionsCount: Number(body.sessionsCount || 4),
        sessions: body.sessions || [],
        increaseTotal: Number(body.increaseTotal || 0),
        active: true,
      },
      create: {
        tenantId,
        name: body.name.trim(),
        price: Number(body.price || 0),
        sessionsCount: Number(body.sessionsCount || 4),
        sessions: body.sessions || [],
        increaseTotal: Number(body.increaseTotal || 0),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    body: {
      name?: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
      active?: boolean;
    },
  ) {
    const existing = await this.prisma.marketingCard.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Card non trovata");
    }

    return this.prisma.marketingCard.update({
      where: {
        id,
      },
      data: {
        name: body.name?.trim() || existing.name,
        price: body.price === undefined ? existing.price : Number(body.price || 0),
        sessionsCount: body.sessionsCount === undefined ? existing.sessionsCount : Number(body.sessionsCount || 4),
        sessions: body.sessions === undefined ? existing.sessions : body.sessions,
        increaseTotal: body.increaseTotal === undefined ? existing.increaseTotal : Number(body.increaseTotal || 0),
        active: body.active === undefined ? existing.active : Boolean(body.active),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.marketingCard.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Card non trovata");
    }

    return this.prisma.marketingCard.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }
}
