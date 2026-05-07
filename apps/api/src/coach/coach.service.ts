import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const existing = await this.prisma.coachSettings.findUnique({
      where: { tenantId },
    });

    if (existing) return existing;

    return this.prisma.coachSettings.create({
      data: { tenantId },
    });
  }

  async updateSettings(tenantId: string, body: any) {
    await this.getSettings(tenantId);

    return this.prisma.coachSettings.update({
      where: { tenantId },
      data: {
        vatServicesPercent: this.num(body.vatServicesPercent),
        vatResalePercent: this.num(body.vatResalePercent),
        posFeePercent: this.num(body.posFeePercent),
        posFixedFee: this.num(body.posFixedFee),
        variableOverheadPercent: this.num(body.variableOverheadPercent),
        taxReservePercent: this.num(body.taxReservePercent),
        productiveHoursMonth: this.num(body.productiveHoursMonth),
        agendaGridMinutes: body.agendaGridMinutes !== undefined ? Number(body.agendaGridMinutes || 5) : undefined,
        cardGiftKitInCost: body.cardGiftKitInCost !== undefined ? Boolean(body.cardGiftKitInCost) : undefined,
        allowedDomains: body.allowedDomains !== undefined ? String(body.allowedDomains || "") : undefined,
      },
    });
  }

  listFixedCosts(tenantId: string) {
    return this.prisma.coachFixedCost.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
    });
  }

  createFixedCost(tenantId: string, body: { name?: string; amount?: number | string }) {
    return this.prisma.coachFixedCost.create({
      data: {
        tenantId,
        name: String(body.name || "").trim().toUpperCase(),
        amount: Number(String(body.amount || 0).replace(",", ".")),
      },
    });
  }

  async updateFixedCost(tenantId: string, id: string, body: { name?: string; amount?: number | string }) {
    const item = await this.prisma.coachFixedCost.findFirst({
      where: { id, tenantId },
    });

    if (!item) throw new NotFoundException("Costo fisso non trovato");

    return this.prisma.coachFixedCost.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim().toUpperCase() : undefined,
        amount: body.amount !== undefined ? Number(String(body.amount || 0).replace(",", ".")) : undefined,
      },
    });
  }

  async deleteFixedCost(tenantId: string, id: string) {
    const item = await this.prisma.coachFixedCost.findFirst({
      where: { id, tenantId },
    });

    if (!item) throw new NotFoundException("Costo fisso non trovato");

    return this.prisma.coachFixedCost.update({
      where: { id },
      data: { active: false },
    });
  }


  listPrebooking(tenantId: string, dateKey?: string) {
    return this.prisma.coachPrebookingResult.findMany({
      where: {
        tenantId,
        ...(dateKey ? { dateKey } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  savePrebooking(
    tenantId: string,
    appointmentId: string,
    body: {
      dateKey?: string;
      clientName?: string;
      clientPhone?: string;
      serviceName?: string;
      status?: string;
      note?: string;
    },
  ) {
    return this.prisma.coachPrebookingResult.upsert({
      where: {
        tenantId_appointmentId: {
          tenantId,
          appointmentId,
        },
      },
      update: {
        dateKey: String(body.dateKey || ""),
        clientName: String(body.clientName || ""),
        clientPhone: body.clientPhone ? String(body.clientPhone) : null,
        serviceName: body.serviceName ? String(body.serviceName) : null,
        status: String(body.status || "NON_PROPOSTO"),
        note: body.note !== undefined ? String(body.note || "") : undefined,
      },
      create: {
        tenantId,
        appointmentId,
        dateKey: String(body.dateKey || ""),
        clientName: String(body.clientName || ""),
        clientPhone: body.clientPhone ? String(body.clientPhone) : null,
        serviceName: body.serviceName ? String(body.serviceName) : null,
        status: String(body.status || "NON_PROPOSTO"),
        note: body.note ? String(body.note) : null,
      },
    });
  }

  private num(value: any) {
    if (value === undefined) return undefined;
    const n = Number(String(value || 0).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
}
